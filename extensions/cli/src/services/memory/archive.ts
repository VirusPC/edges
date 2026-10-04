import { promises as fs } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pipeline } from 'node:stream/promises';
import { homedir, tmpdir } from 'node:os';
import path from 'node:path';
import { create, list } from 'tar';
import { readTemplate } from './templates.js';

const USERS = '.harness/memory/users';
const CONVERSION = 'conversion-required: restore the old archive with its matching older tool in an isolated old project, run edges memory migrate there, then create a new user-memory-backup archive.';
const expandHome = (value: string): string => value === '~' ? homedir() : value.startsWith('~/') ? path.join(homedir(), value.slice(2)) : value;

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
  try { execFileSync('git', ['-C', root, 'rev-parse', '--show-toplevel'], { stdio: 'pipe' }); }
  catch { return; }
  for (const rule of rules) {
    let sample = rule.replace(/^\//, '').replace(/\*/g, 'sample');
    if (sample.endsWith('/')) sample += 'AGENTS.md';
    try { execFileSync('git', ['-C', root, 'check-ignore', '-q', '--no-index', sample], { stdio: 'pipe' }); }
    catch { throw new Error('忽略规则未生效: ' + rule); }
  }
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
  const files = await collect(root);
  const destination = await realLocation(options.outputDir ?? root);
  if (inside(destination, path.join(root, USERS))) throw new Error('归档不能写入用户记忆正文目录');
  const stamp = options.timestamp ?? new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  if (!/^[A-Za-z0-9_-]+$/.test(stamp)) throw new Error('非法时间戳');
  const archive = path.join(destination, `user-memory-backup-${stamp}.tar.gz`);
  if (await info(archive)) throw new Error('归档已存在，拒绝覆盖: ' + archive);
  await fs.mkdir(destination, { recursive: true });
  await ensureIgnore(destination, ['user-memory-backup-*.tar.gz']);
  await ensureIgnore(root, ['/' + USERS + '/']);
  const handle = await fs.open(archive, 'wx', 0o600);
  try {
    for (const file of files) await safeParents(path.join(root, file), root);
    await pipeline(create({ cwd: root, gzip: true, noDirRecurse: true, strict: true }, files), handle.createWriteStream());
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

type Member = { name: string; mode: number; bytes: Buffer };

async function readMembers(archive: string): Promise<Member[]> {
  const members: Member[] = [], seen = new Set<string>();
  const pending: Promise<void>[] = [];
  let failure: Error | undefined;
  await list({ file: archive, strict: true, onReadEntry(entry) {
    // Consume every stream, even when a member is invalid, so validation cannot hang.
    const chunks: Buffer[] = [];
    let name = entry.path.replace(/\\/g, '/');
    if (name.startsWith('./')) name = name.slice(2);
    if (name.startsWith('/') || name.split('/').includes('..') || !name) failure ??= new Error('归档含非法路径: ' + name);
    if (name.startsWith('.memory/')) failure ??= new Error(CONVERSION);
    if (!name.startsWith(USERS + '/')) failure ??= new Error('归档含非用户记忆路径: ' + name);
    if (entry.type !== 'File' && entry.type !== 'OldFile') failure ??= new Error('归档含非普通文件成员: ' + name);
    name = path.posix.normalize(name);
    if (!name.startsWith(USERS + '/')) failure ??= new Error('归档含非用户记忆路径: ' + name);
    if (seen.has(name)) failure ??= new Error('归档含重复路径: ' + name);
    seen.add(name);
    pending.push(new Promise<void>(resolve => {
      entry.on('data', chunk => chunks.push(Buffer.from(chunk)));
      entry.on('error', error => { failure ??= error instanceof Error ? error : new Error(String(error)); resolve(); });
      entry.on('end', () => { members.push({ name, mode: (entry.mode ?? 0o600) & 0o777, bytes: Buffer.concat(chunks) }); resolve(); });
    }));
  } });
  await Promise.all(pending);
  if (failure) throw failure;
  if (!members.length) throw new Error('归档里没有 .harness/memory/users/ 成员');
  for (const name of seen) {
    for (let parent = path.posix.dirname(name); parent !== '.'; parent = path.posix.dirname(parent)) {
      if (seen.has(parent)) throw new Error('归档路径既是文件又是目录: ' + name);
    }
  }
  return members;
}

export async function restoreUserMemory(options: { archive: string; repoDir: string; force?: boolean }) {
  const archive = await fs.realpath(expandHome(options.archive)), root = await directory(options.repoDir);
  if (!(await fs.stat(archive)).isFile()) throw new Error('归档不存在或不是文件');
  const users = path.join(root, USERS);
  if (inside(archive, users)) throw new Error('先将归档移到待替换 users 目录之外');
  await safeParents(path.dirname(users), root);
  const members = await readMembers(archive);
  if (await occupied(root) && !options.force) throw new Error('目标已有用户记忆，拒绝覆盖；确认后加 --force（替换，不合并）');
  if (!options.force) for (const member of members) await safeParents(path.join(root, member.name), root);
  const staging = await fs.mkdtemp(path.join(tmpdir(), 'private-user-memory-'));
  try {
    await fs.chmod(staging, 0o700);
    for (const member of members) {
      const file = path.join(staging, member.name);
      await fs.mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
      await fs.writeFile(file, member.bytes, { flag: 'wx', mode: 0o600 });
    }
    await ensureIgnore(root, ['/' + USERS + '/']);
    if (options.force && await info(users)) await fs.rm(users, { recursive: true, force: true });
    for (const member of members) {
      const file = path.join(root, member.name);
      await safeParents(file, root);
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.copyFile(path.join(staging, member.name), file);
      await fs.chmod(file, member.mode);
    }
  } finally { await fs.rm(staging, { recursive: true, force: true }); }
  return { archive, repoDir: root, extracted: members.map(member => member.name), indexRefresh: 'preserved-archive-index' };
}
