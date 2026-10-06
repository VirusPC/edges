import { createReadStream, promises as fs } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Transform, PassThrough } from 'node:stream';
import { createGunzip, createGzip } from 'node:zlib';
import { expandHomePath } from '../../utils/filesystem.js';
import path from 'node:path';
import { create, Header, Parser, type ReadEntry } from 'tar';
import { assertPrivateIgnored } from './ignore.js';
import { rejectLegacy } from './paths.js';
import { readTemplate } from './templates.js';

const USERS = '.harness/memory/users';
const PRIVATE_STAGE_RULE = '/.private-user-memory-*/';
export const USER_MEMORY_ARCHIVE_LIMITS = { maxExpandedBytes: 256 * 1024 * 1024, maxMembers: 10_000 } as const;
type ArchiveLimits = { maxExpandedBytes: number; maxMembers: number };

function expandedByteLimit(maximum: number): Transform {
  let bytes = 0;
  return new Transform({ transform(chunk: Buffer, _encoding, callback) {
    bytes += chunk.length;
    callback(bytes > maximum ? new Error('archive expanded byte limit exceeded') : null, chunk);
  } });
}

// Prevent the tar parser from auto-decompressing a second layer after the byte limiter.
function requireTarHeader(): Transform {
  let header = Buffer.alloc(0), checked = false;
  return new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      if (checked) { callback(null, chunk); return; }
      const needed = 512 - header.length;
      header = Buffer.concat([header, chunk.subarray(0, needed)]);
      if (header.length < 512) { callback(); return; }
      try {
        const parsed = new Header(header);
        if ((header[0] === 0x1f && header[1] === 0x8b) || (!parsed.cksumValid && !parsed.nullBlock)) throw new Error('Invalid tar format (expected raw tar or gzip tar)');
        checked = true;
        this.push(header);
        callback(null, chunk.subarray(needed));
      } catch (error) { callback(error as Error); }
    },
    flush(callback) { callback(checked ? null : new Error('Invalid or truncated tar format')); },
  });
}

async function archiveDecoder(archive: string): Promise<Transform> {
  const handle = await fs.open(archive, 'r'), magic = Buffer.alloc(2);
  try { await handle.read(magic, 0, 2, 0); }
  finally { await handle.close(); }
  return magic[0] === 0x1f && magic[1] === 0x8b ? createGunzip() : new PassThrough();
}

async function rejectOldLayer(root: string): Promise<void> {
  try { rejectLegacy(root); }
  catch (error) { throw new Error(`${(error as Error).message}; ${CONVERSION}`); }
  if (await info(path.join(root, ".memory"))) throw new Error(CONVERSION);
}

const CONVERSION = 'conversion-required: restore the old archive with its matching older tool in an isolated old project, run edges memory migrate there, then create a new user-memory-backup archive.';
const expandHome = (value: string): string => expandHomePath(value, true);

function inside(file: string, root: string): boolean {
  const relative = path.relative(root, file);
  return relative === '' || (!path.isAbsolute(relative) && relative !== '..' && !relative.startsWith('..' + path.sep));
}

async function info(file: string) {
  try { return await fs.lstat(file); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined; throw error; }
}

async function safeParents(file: string, root: string): Promise<void> {
  if (!inside(file, root)) throw new Error('路径不在目标目录内');
  for (let current = file; ; current = path.dirname(current)) {
    if ((await info(current))?.isSymbolicLink()) throw new Error('路径含符号链接: ' + current);
    if (current === root) return;
  }
}

async function realLocation(file: string): Promise<string> {
  file = path.resolve(expandHome(file));
  try { return await fs.realpath(file); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    const parent = path.dirname(file);
    if (parent === file) throw error;
    return path.join(await realLocation(parent), path.basename(file));
  }
}

async function directory(raw: string): Promise<string> {
  const resolved = await fs.realpath(expandHome(raw));
  if (!(await fs.stat(resolved)).isDirectory()) throw new Error('目标目录不存在或不是目录');
  return resolved;
}

async function ensureIgnore(root: string, rules: string[]): Promise<void> {
  const file = path.join(root, '.gitignore');
  const existing = await info(file);
  if (existing && (!existing.isFile() || existing.isSymbolicLink())) throw new Error('不安全的 .gitignore');
  const before = existing ? await fs.readFile(file, 'utf8') : '';
  const missing = rules.filter(rule => !before.split(/\r?\n/).includes(rule));
  if (missing.length) await fs.writeFile(file, before.trimEnd() + '\n\n# Private user memory\n' + missing.join('\n') + '\n');
}

async function collect(root: string): Promise<string[]> {
  const users = path.join(root, USERS);
  await safeParents(users, root);
  if (!(await info(users))?.isDirectory()) {
    if (await info(path.join(root, '.memory'))) throw new Error(CONVERSION);
    throw new Error('没有可备份的用户记忆：缺少 .harness/memory/users/');
  }
  const files: string[] = [];
  async function visit(dir: string): Promise<void> {
    for (const name of (await fs.readdir(dir)).sort()) {
      const file = path.join(dir, name), entry = await fs.lstat(file);
      if (entry.isSymbolicLink() || (!entry.isDirectory() && !entry.isFile())) throw new Error('用户记忆含非普通文件或符号链接: ' + file);
      if (entry.isFile() && entry.nlink > 1) throw new Error('用户记忆含硬链接 (hardlink): ' + file);
      if (entry.isDirectory()) await visit(file);
      else files.push(path.relative(root, file).split(path.sep).join('/'));
    }
  }
  await visit(users);
  if (!files.length) throw new Error('没有可备份的用户记忆文件');
  return files;
}

export async function backupUserMemory(options: { repoDir: string; outputDir?: string; timestamp?: string }): Promise<{ archive: string }> {
  const root = await directory(options.repoDir);
  await rejectOldLayer(root);
  const files = await collect(root);
  if (files.length > USER_MEMORY_ARCHIVE_LIMITS.maxMembers) throw new Error('archive member count limit exceeded');
  const destination = await realLocation(options.outputDir ?? root);
  if (inside(destination, path.join(root, USERS))) throw new Error('归档不能写入用户记忆正文目录');
  const stamp = options.timestamp ?? new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  if (!/^[A-Za-z0-9_-]+$/.test(stamp)) throw new Error('非法时间戳');
  const archive = path.join(destination, `user-memory-backup-${stamp}.tar.gz`);
  if (await info(archive)) throw new Error('归档已存在，拒绝覆盖: ' + archive);
  await fs.mkdir(destination, { recursive: true });
  await ensureIgnore(destination, ['user-memory-backup-*.tar.gz']);
  await ensureIgnore(root, ['/' + USERS + '/']);
  assertPrivateIgnored(root, files.map(file => path.join(root, file)), [path.join(root, USERS)]);
  assertPrivateIgnored(destination, [archive]);
  const handle = await fs.open(archive, 'wx', 0o600);
  try {
    for (const file of files) await safeParents(path.join(root, file), root);
    await pipeline(create({ cwd: root, noDirRecurse: true, strict: true }, files), expandedByteLimit(USER_MEMORY_ARCHIVE_LIMITS.maxExpandedBytes), createGzip(), handle.createWriteStream());
  } catch (error) {
    await handle.close();
    await fs.rm(archive, { force: true });
    throw error;
  }
  return { archive };
}

async function occupied(root: string): Promise<boolean> {
  const users = path.join(root, USERS), entry = await info(users);
  if (!entry) return false;
  if (!entry.isDirectory() || entry.isSymbolicLink()) return true;
  const files = await fs.readdir(users);
  if (!files.length) return false;
  if (files.length !== 1 || files[0] !== 'AGENTS.md') return true;
  const index = path.join(users, files[0]), indexInfo = await fs.lstat(index);
  if (!indexInfo.isFile() || indexInfo.isSymbolicLink()) return true;
  try { return !(await fs.readFile(index)).equals(Buffer.from(readTemplate('USER.md').trimEnd() + '\n')); }
  catch { return true; }
}

async function stageMembers(archive: string, staging: string, limits: ArchiveLimits): Promise<string[]> {
  const seen = new Set<string>(), directories = new Set<string>();
  const pending: Promise<void>[] = [];
  const controller = new AbortController();
  let failure: unknown, declaredBytes = 0;
  const parser = new Parser({ strict: true, brotli: false, zstd: false, onReadEntry(entry) {
    const task = save(entry).catch(error => {
      failure ??= error;
      controller.abort(error);
      entry.destroy();
    });
    pending.push(task);
  } });
  async function save(entry: ReadEntry): Promise<void> {
    let name = entry.path.replace(/\\/g, '/');
    if (name.startsWith('./')) name = name.slice(2);
    if (name.startsWith('/') || name.split('/').includes('..') || !name) throw new Error('归档含非法路径: ' + name);
    if (name.startsWith('.memory/')) throw new Error(CONVERSION);
    if (!name.startsWith(USERS + '/')) throw new Error('归档含非用户记忆路径: ' + name);
    if (entry.type !== 'File' && entry.type !== 'OldFile') throw new Error('归档含非普通文件成员: ' + name);
    name = path.posix.normalize(name);
    if (!name.startsWith(USERS + '/')) throw new Error('归档含非用户记忆路径: ' + name);
    if (seen.has(name)) throw new Error('归档含重复路径: ' + name);
    if (directories.has(name)) throw new Error('归档路径既是文件又是目录: ' + name);
    for (let parent = path.posix.dirname(name); parent !== '.'; parent = path.posix.dirname(parent)) {
      if (seen.has(parent)) throw new Error('归档路径既是文件又是目录: ' + name);
      directories.add(parent);
    }
    seen.add(name);
    if (seen.size > limits.maxMembers) throw new Error('archive member count limit exceeded');
    declaredBytes += entry.size;
    if (!Number.isSafeInteger(entry.size) || entry.size < 0 || declaredBytes > limits.maxExpandedBytes) throw new Error('archive declared size limit exceeded');
    const file = path.join(staging, name.slice(USERS.length + 1));
    await fs.mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
    const handle = await fs.open(file, 'wx', 0o600);
    try {
      await pipeline(entry, handle.createWriteStream(), { signal: controller.signal });
      await fs.chmod(file, (entry.mode ?? 0o600) & 0o777);
    } finally { await handle.close(); }
  }
  try {
    const decoder = await archiveDecoder(archive);
    await pipeline(createReadStream(archive), decoder, expandedByteLimit(limits.maxExpandedBytes), requireTarHeader(), parser, { signal: controller.signal });
  } catch (error) {
    failure ??= error;
    controller.abort(error);
  }
  await Promise.all(pending);
  if (failure) throw failure;
  if (!seen.size) throw new Error('归档里没有 .harness/memory/users/ 成员');
  return [...seen];
}

export async function restoreUserMemory(options: { archive: string; repoDir: string; force?: boolean; limits?: Partial<ArchiveLimits> }) {
  const archive = await fs.realpath(expandHome(options.archive)), root = await directory(options.repoDir);
  await rejectOldLayer(root);
  if (!(await fs.stat(archive)).isFile()) throw new Error('归档不存在或不是文件');
  const users = path.join(root, USERS);
  if (inside(archive, users)) throw new Error('先将归档移到待替换 users 目录之外');
  await safeParents(path.dirname(users), root);
  if (await occupied(root) && !options.force) throw new Error('目标已有用户记忆，拒绝覆盖；确认后加 --force（替换，不合并）');
  const limits = { ...USER_MEMORY_ARCHIVE_LIMITS, ...options.limits };
  if (Object.values(limits).some(value => !Number.isSafeInteger(value) || value <= 0)) throw new Error('Invalid archive limits');
  const ignore = path.join(root, '.gitignore'), ignoreInfo = await info(ignore);
  if (ignoreInfo && (!ignoreInfo.isFile() || ignoreInfo.isSymbolicLink())) throw new Error('不安全的 .gitignore');
  const beforeIgnore = ignoreInfo ? await fs.readFile(ignore) : undefined;
  // Stage on the target filesystem. Ignore rules and the 0700 container precede private writes.
  await ensureIgnore(root, ['/' + USERS + '/', PRIVATE_STAGE_RULE]);
  const temporaryIgnore = await fs.readFile(ignore);
  let staging: string | undefined, retainRecovery = false, installed = false;
  try {
    staging = await fs.mkdtemp(path.join(root, '.private-user-memory-'));
    await fs.chmod(staging, 0o700);
    const replacement = path.join(staging, 'replacement'), previous = path.join(staging, 'previous');
    assertPrivateIgnored(root, [previous], [staging, replacement]);
    await fs.mkdir(replacement, { mode: 0o700 });
    const members = await stageMembers(archive, replacement, limits);
    await safeParents(path.dirname(users), root);
    await fs.mkdir(path.dirname(users), { recursive: true });
    const previousInfo = await info(users), hadPrevious = Boolean(previousInfo);
    const destinations = members.map(member => path.join(root, member));
    // Git cannot check descendants of a symlink. Move only that link aside, then
    // validate its future replacement paths inside the existing rollback boundary.
    if (!previousInfo?.isSymbolicLink()) assertPrivateIgnored(root, destinations, [users]);
    if (hadPrevious) await fs.rename(users, previous);
    try {
      if (previousInfo?.isSymbolicLink()) assertPrivateIgnored(root, destinations, [users]);
      await fs.rename(replacement, users);
    }
    catch (error) {
      if (hadPrevious) {
        try { await fs.rename(previous, users); }
        catch (rollbackError) {
          retainRecovery = true;
          throw new AggregateError([error, rollbackError], 'Restore rollback failed; recovery copy retained at ' + previous);
        }
      }
      throw error;
    }
    installed = true;
    return { archive, repoDir: root, extracted: members, indexRefresh: 'preserved-archive-index' };
  } finally {
    if (staging && !retainRecovery) await fs.rm(staging, { recursive: true, force: true });
    if (!installed && !retainRecovery && (await fs.readFile(ignore)).equals(temporaryIgnore)) {
      if (beforeIgnore) await fs.writeFile(ignore, beforeIgnore);
      else await fs.rm(ignore);
    }
  }
}
