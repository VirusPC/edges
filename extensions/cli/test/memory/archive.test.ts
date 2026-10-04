import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import { mkdtemp, mkdir, writeFile, readFile, stat, lstat, chmod, rm, symlink, realpath, readdir, link } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { homedir, tmpdir } from 'node:os';
import path from 'node:path';
import { gzipSync, gunzipSync } from 'node:zlib';
import { Header, type HeaderData } from 'tar';
import { target } from '../../src/memory/utils/command.js';
import { resolveTarget } from '../../src/services/memory/paths.js';
import { backupUserMemory, restoreUserMemory } from '../../src/services/memory/archive.js';

const users = '.harness/memory/users';
async function fixture(t: TestContext) {
  const root = await realpath(await mkdtemp(path.join(tmpdir(), 'edges-private-archive-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const source = path.join(root, 'source'), destination = path.join(root, 'destination');
  await mkdir(path.join(source, users, 'assets'), { recursive: true });
  await mkdir(destination);
  await writeFile(path.join(source, users, 'AGENTS.md'), '# Private index\n');
  await writeFile(path.join(source, users, 'user_pref.md'), 'private bytes\n', { mode: 0o600 });
  await writeFile(path.join(source, users, 'assets/image.bin'), Buffer.from([0, 255, 17]));
  return { root, source, destination };
}

function tarBytes(entries: (HeaderData & { content?: string })[]) {
  return gzipSync(Buffer.concat([...entries.flatMap(({ content = '', ...fields }) => {
    const bytes = Buffer.from(content);
    const header = new Header({ type: 'File', mode: 0o600, size: bytes.length, ...fields });
    header.encode();
    return [header.block!, bytes, Buffer.alloc((512 - bytes.length % 512) % 512)];
  }), Buffer.alloc(1024)]));
}

test('private archive roundtrip retains bytes, assets, index and permissions with effective ignores', async t => {
  const { source, destination } = await fixture(t);
  for (const directory of [source, destination]) execFileSync('git', ['init', '-q', directory]);
  const { archive } = await backupUserMemory({ repoDir: source, timestamp: 'fixed' });
  assert.equal((await stat(archive)).mode & 0o777, 0o600);
  const result = await restoreUserMemory({ archive, repoDir: destination });
  assert.equal(result.indexRefresh, 'preserved-archive-index');
  for (const name of ['AGENTS.md', 'user_pref.md', 'assets/image.bin']) {
    assert.deepEqual(await readFile(path.join(destination, users, name)), await readFile(path.join(source, users, name)));
  }
  assert.equal((await stat(path.join(destination, users, 'user_pref.md'))).mode & 0o777, 0o600);
  for (const directory of [source, destination]) execFileSync('git', ['-C', directory, 'check-ignore', '-q', '--no-index', `${users}/AGENTS.md`]);
  execFileSync('git', ['-C', source, 'check-ignore', '-q', '--no-index', archive]);
});

test('backup refuses collisions, source links, legacy data, empty sources and escaping timestamps', async t => {
  const { root, source, destination } = await fixture(t);
  const { archive } = await backupUserMemory({ repoDir: source, timestamp: 'fixed' });
  const original = await readFile(archive);
  await assert.rejects(backupUserMemory({ repoDir: source, timestamp: 'fixed' }), /exist|已存在/);
  assert.deepEqual(await readFile(archive), original);
  await assert.rejects(backupUserMemory({ repoDir: source, timestamp: '../outside' }), /timestamp|时间戳/);
  await assert.rejects(backupUserMemory({ repoDir: source, outputDir: path.join(source, users, 'output') }), /正文|inside|within/);
  await symlink(destination, path.join(source, users, 'linked'));
  await assert.rejects(backupUserMemory({ repoDir: source }), /symbolic|符号链接/);
  await assert.rejects(backupUserMemory({ repoDir: destination }), /没有|missing/);
  await mkdir(path.join(destination, '.memory/users'), { recursive: true });
  await assert.rejects(backupUserMemory({ repoDir: destination }), /conversion-required/);
  assert.equal((await readdir(root)).length, 2);
});

test('restore refuses any occupied content and force replaces the whole users subtree', async t => {
  const { source, destination } = await fixture(t);
  const { archive } = await backupUserMemory({ repoDir: source });
  await mkdir(path.join(destination, users), { recursive: true });
  const old = path.join(destination, users, 'unusual.txt');
  await writeFile(old, 'keep until authorized');
  await assert.rejects(restoreUserMemory({ archive, repoDir: destination }), /force/);
  assert.equal(await readFile(old, 'utf8'), 'keep until authorized');
  await restoreUserMemory({ archive, repoDir: destination, force: true });
  await assert.rejects(stat(old), { code: 'ENOENT' });
});

test('only a byte-identical empty generated index is unoccupied', async t => {
  const { source, destination } = await fixture(t);
  const { archive } = await backupUserMemory({ repoDir: source });
  const template = await readFile(new URL('../../../skills/project-memory-init/references/templates/USER.tmpl.md', import.meta.url), 'utf8');
  await mkdir(path.join(destination, users), { recursive: true });
  const index = path.join(destination, users, 'AGENTS.md');
  await writeFile(index, template.trimEnd() + '\n');
  await restoreUserMemory({ archive, repoDir: destination });
  await rm(path.join(destination, users), { recursive: true });
  await mkdir(path.join(destination, users), { recursive: true });
  await writeFile(index, template.trimEnd() + '\nPrivate manual text\n');
  await assert.rejects(restoreUserMemory({ archive, repoDir: destination }), /force/);
});

test('malicious, duplicate, legacy and conflicting archive paths fail before target changes', async t => {
  const { root, destination } = await fixture(t);
  const cases: (HeaderData & { content?: string })[][] = [
    [{ path: '../outside', content: 'bad' }], [{ path: '/outside', content: 'bad' }],
    [{ path: `${users}/../escape`, content: 'bad' }], [{ path: '.memory/users/user_old.md', content: 'old' }],
    [{ path: `${users}/x`, type: 'SymbolicLink', linkpath: '/outside' }],
    [{ path: `${users}/x`, type: 'Link', linkpath: '/outside' }],
    [{ path: `${users}/x` }, { path: `${users}/./x` }],
    [{ path: `${users}/x` }, { path: `${users}/x/y` }],
    [{ path: `${users}/x`, type: 'Directory' }], [],
  ];
  for (const [i, entries] of cases.entries()) {
    const archive = path.join(root, `bad-${i}.tar.gz`);
    await writeFile(archive, tarBytes(entries));
    await assert.rejects(restoreUserMemory({ archive, repoDir: destination, force: true }));
    assert.deepEqual(await readdir(destination), []);
  }
});

test('restore rejects linked harness ancestors; force replaces only users link, never its target', async t => {
  const { root, source, destination } = await fixture(t);
  const { archive } = await backupUserMemory({ repoDir: source });
  const external = path.join(root, 'external');
  await mkdir(external);
  await writeFile(path.join(external, 'keep'), 'external');
  await symlink(external, path.join(destination, '.harness'));
  await assert.rejects(restoreUserMemory({ archive, repoDir: destination, force: true }), /symbolic|符号链接/);
  await rm(path.join(destination, '.harness'));
  await mkdir(path.join(destination, '.harness/memory'), { recursive: true });
  await symlink(external, path.join(destination, users));
  await assert.rejects(restoreUserMemory({ archive, repoDir: destination }), /force|symbolic|符号链接/);
  await restoreUserMemory({ archive, repoDir: destination, force: true });
  assert.equal((await lstat(path.join(destination, users))).isSymbolicLink(), false);
  assert.equal(await readFile(path.join(external, 'keep'), 'utf8'), 'external');
});


test('force restore retains the old bytes and modes when staging chmod fails', async t => {
  const { source, destination } = await fixture(t);
  const { archive } = await backupUserMemory({ repoDir: source });
  const old = path.join(destination, users, 'old.txt');
  await mkdir(path.dirname(old), { recursive: true });
  await writeFile(old, 'old private bytes', { mode: 0o640 });
  const realChmod = fs.chmod;
  t.mock.method(fs, 'chmod', async (file: Parameters<typeof fs.chmod>[0], mode: number) => {
    if (String(file).endsWith('user_pref.md')) throw new Error('injected chmod failure');
    return realChmod(file, mode);
  });
  await assert.rejects(restoreUserMemory({ archive, repoDir: destination, force: true }), /injected chmod failure/);
  assert.equal(await readFile(old, 'utf8'), 'old private bytes');
  assert.equal((await stat(old)).mode & 0o777, 0o640);
  assert.deepEqual(await readdir(path.dirname(old)), ['old.txt']);
});

test('force restore rolls back when replacement rename fails, with private ignored staging', async t => {
  const { source, destination } = await fixture(t);
  execFileSync('git', ['init', '-q', destination]);
  const { archive } = await backupUserMemory({ repoDir: source });
  const targetUsers = path.join(destination, users);
  await mkdir(targetUsers, { recursive: true });
  await writeFile(path.join(targetUsers, 'old.txt'), 'old private bytes');
  const realRename = fs.rename;
  t.mock.method(fs, 'rename', async (from: Parameters<typeof fs.rename>[0], to: Parameters<typeof fs.rename>[1]) => {
    if (String(to) === targetUsers && await readFile(path.join(String(from), 'user_pref.md')).catch(() => undefined)) {
      const stage = path.dirname(String(from));
      assert.equal((await stat(stage)).mode & 0o777, 0o700);
      execFileSync('git', ['-C', destination, 'check-ignore', '-q', '--no-index', path.join(String(from), 'user_pref.md')]);
      throw new Error('injected replacement failure');
    }
    return realRename(from, to);
  });
  await assert.rejects(restoreUserMemory({ archive, repoDir: destination, force: true }), /injected replacement failure/);
  assert.equal(await readFile(path.join(targetUsers, 'old.txt'), 'utf8'), 'old private bytes');
  assert.deepEqual(await readdir(targetUsers), ['old.txt']);
  assert.equal((await readdir(destination)).some(name => name.startsWith('.private-user-memory-')), false);
});

test('failed rollback retains a restricted ignored recovery copy', async t => {
  const { source, destination } = await fixture(t);
  execFileSync('git', ['init', '-q', destination]);
  const { archive } = await backupUserMemory({ repoDir: source });
  const targetUsers = path.join(destination, users);
  await mkdir(targetUsers, { recursive: true });
  await writeFile(path.join(targetUsers, 'old.txt'), 'recover me');
  const realRename = fs.rename;
  t.mock.method(fs, 'rename', async (from: Parameters<typeof fs.rename>[0], to: Parameters<typeof fs.rename>[1]) => {
    if (String(to) === targetUsers) throw new Error('injected rename failure');
    return realRename(from, to);
  });
  await assert.rejects(restoreUserMemory({ archive, repoDir: destination, force: true }), /recovery|恢复|rollback/i);
  const recovery = (await readdir(destination)).find(name => name.startsWith('.private-user-memory-'));
  assert.ok(recovery);
  assert.equal((await stat(path.join(destination, recovery))).mode & 0o777, 0o700);
  assert.equal(await readFile(path.join(destination, recovery, 'previous', 'old.txt'), 'utf8'), 'recover me');
  execFileSync('git', ['-C', destination, 'check-ignore', '-q', '--no-index', `${recovery}/previous/old.txt`]);
});

test('expanded bytes, declared sizes and member count are bounded before replacement', async t => {
  const { root, destination } = await fixture(t);
  const old = path.join(destination, users, 'old.txt');
  await mkdir(path.dirname(old), { recursive: true });
  await writeFile(old, 'keep');
  const cases = [
    { entries: [{ path: `${users}/large`, content: 'x'.repeat(4096) }], limits: { maxExpandedBytes: 2048 } },
    { entries: [{ path: `${users}/large`, size: 1024 * 1024 }], limits: { maxExpandedBytes: 2048 } },
    { entries: [{ path: `${users}/a` }, { path: `${users}/b` }], limits: { maxMembers: 1 } },
  ];
  for (const [i, item] of cases.entries()) {
    const archive = path.join(root, `limit-${i}.tar.gz`);
    await writeFile(archive, tarBytes(item.entries));
    await assert.rejects(restoreUserMemory({ archive, repoDir: destination, force: true, limits: item.limits }), /limit|限额/);
    assert.equal(await readFile(old, 'utf8'), 'keep');
    assert.deepEqual(await readdir(path.dirname(old)), ['old.txt']);
  }
});

test('backup and restore reject legacy coexistence without changing either layout', async t => {
  const { source, destination } = await fixture(t);
  const { archive } = await backupUserMemory({ repoDir: source, timestamp: 'before' });
  for (const root of [source, destination]) {
    await mkdir(path.join(root, '.memory/users'), { recursive: true });
    await writeFile(path.join(root, '.memory/users/old.md'), 'legacy bytes');
  }
  await mkdir(path.join(destination, users), { recursive: true });
  await writeFile(path.join(destination, users, 'current.md'), 'current bytes');
  await assert.rejects(backupUserMemory({ repoDir: source, timestamp: 'after' }), /migration-required|conversion-required/);
  await assert.rejects(restoreUserMemory({ archive, repoDir: destination, force: true }), /migration-required|conversion-required/);
  for (const root of [source, destination]) assert.equal(await readFile(path.join(root, '.memory/users/old.md'), 'utf8'), 'legacy bytes');
  assert.equal(await readFile(path.join(destination, users, 'current.md'), 'utf8'), 'current bytes');
  assert.equal(await readFile(path.join(source, users, 'user_pref.md'), 'utf8'), 'private bytes\n');
  await assert.rejects(stat(path.join(source, 'user-memory-backup-after.tar.gz')), { code: 'ENOENT' });
});

test('backup refuses hardlinked sources before producing an unusable archive', async t => {
  const { source } = await fixture(t);
  await link(path.join(source, users, 'user_pref.md'), path.join(source, users, 'second.md'));
  await assert.rejects(backupUserMemory({ repoDir: source, timestamp: 'hardlink' }), /hardlink|hard link|硬链接/i);
  await assert.rejects(stat(path.join(source, 'user-memory-backup-hardlink.tar.gz')), { code: 'ENOENT' });
});

test('explicit CLI target retains home expansion for the service resolver', async () => {
  const value = target({ targetDir: '~/' }, { env: {}, result: undefined });
  assert.equal(resolveTarget(value), await realpath(homedir()));
});

test('legacy dangling links cannot bypass archive layout rejection', async t => {
  const { source, destination } = await fixture(t);
  const { archive } = await backupUserMemory({ repoDir: source, timestamp: 'before' });
  for (const root of [source, destination]) await symlink('absent-legacy', path.join(root, '.memory'));
  await assert.rejects(backupUserMemory({ repoDir: source, timestamp: 'after' }), /migration-required|conversion-required/);
  await assert.rejects(restoreUserMemory({ archive, repoDir: destination, force: true }), /migration-required|conversion-required/);
  assert.deepEqual(await readdir(destination), ['.memory']);
});

test('raw tar restores the same bytes and modes as gzip tar', async t => {
  const { root, source, destination } = await fixture(t);
  const { archive } = await backupUserMemory({ repoDir: source });
  const raw = path.join(root, 'memory.tar');
  await writeFile(raw, gunzipSync(await readFile(archive)));
  await restoreUserMemory({ archive: raw, repoDir: destination });
  for (const name of ['AGENTS.md', 'user_pref.md', 'assets/image.bin']) {
    assert.deepEqual(await readFile(path.join(destination, users, name)), await readFile(path.join(source, users, name)));
  }
  assert.equal((await stat(path.join(destination, users, 'user_pref.md'))).mode & 0o777, 0o600);
});

test('nested compression cannot bypass the expanded tar byte limit', async t => {
  const { root, destination } = await fixture(t);
  const archive = path.join(root, 'nested.tar.gz');
  await writeFile(archive, gzipSync(gzipSync(Buffer.concat([gunzipSync(tarBytes([{ path: `${users}/small`, content: 'x' }])), Buffer.alloc(4096)]))));
  await assert.rejects(restoreUserMemory({ archive, repoDir: destination, limits: { maxExpandedBytes: 2048 } }), /tar|limit|format|格式/);
  assert.deepEqual(await readdir(destination), []);
});

async function exposePrivateMember(root: string, name: string) {
  await mkdir(path.join(root, '.harness'), { recursive: true });
  await writeFile(path.join(root, '.harness/.gitignore'), `!memory/users/\nmemory/users/*\n!memory/users/${name}\n`);
}

test('backup refuses an actually unignored source member before creating its archive', async t => {
  const { source } = await fixture(t);
  execFileSync('git', ['init', '-q', source]);
  await writeFile(path.join(source, '.gitignore'), `/${users}/\n`);
  await exposePrivateMember(source, 'user_pref.md');
  const before = await readFile(path.join(source, users, 'user_pref.md'));
  await assert.rejects(backupUserMemory({ repoDir: source, timestamp: 'exposed' }), /private-ignore|忽略/);
  await assert.rejects(stat(path.join(source, 'user-memory-backup-exposed.tar.gz')), { code: 'ENOENT' });
  assert.deepEqual(await readFile(path.join(source, users, 'user_pref.md')), before);
});

test('restore refuses an actually unignored destination member before replacing users', async t => {
  const { source, destination } = await fixture(t);
  const { archive } = await backupUserMemory({ repoDir: source });
  execFileSync('git', ['init', '-q', destination]);
  await writeFile(path.join(destination, '.gitignore'), `/${users}/\n`);
  await exposePrivateMember(destination, 'user_pref.md');
  await mkdir(path.join(destination, users), { recursive: true });
  await writeFile(path.join(destination, users, 'old.md'), 'keep original bytes');
  await assert.rejects(restoreUserMemory({ archive, repoDir: destination, force: true }), /private-ignore|忽略/);
  assert.deepEqual(await readdir(path.join(destination, users)), ['old.md']);
  assert.equal(await readFile(path.join(destination, users, 'old.md'), 'utf8'), 'keep original bytes');
});

test('backup checks its exact output path against a filename-specific negation', async t => {
  const { source } = await fixture(t);
  execFileSync('git', ['init', '-q', source]);
  await writeFile(path.join(source, '.gitignore'), 'user-memory-backup-*.tar.gz\n!user-memory-backup-fixed.tar.gz\n');
  await assert.rejects(backupUserMemory({ repoDir: source, timestamp: 'fixed' }), /private-ignore|忽略/);
  await assert.rejects(stat(path.join(source, 'user-memory-backup-fixed.tar.gz')), { code: 'ENOENT' });
});

test('restore checks the generated stage path before its first private write', async t => {
  const { source, destination } = await fixture(t);
  const { archive } = await backupUserMemory({ repoDir: source });
  execFileSync('git', ['init', '-q', destination]);
  await writeFile(path.join(destination, '.gitignore'), '/.private-user-memory-*/\n!/.private-user-memory-exposed/\n');
  const stage = path.join(destination, '.private-user-memory-exposed');
  t.mock.method(fs, 'mkdtemp', async () => { await mkdir(stage, { mode: 0o700 }); return stage; });
  const open = fs.open;
  t.mock.method(fs, 'open', async (...args: Parameters<typeof fs.open>) => {
    if (String(args[0]).startsWith(stage + path.sep)) throw new Error('private write attempted before ignore guard');
    return open(...args);
  });
  await assert.rejects(restoreUserMemory({ archive, repoDir: destination }), /private-ignore|忽略/);
  await assert.rejects(stat(path.join(destination, users)), { code: 'ENOENT' });
  await assert.rejects(stat(stage), { code: 'ENOENT' });
});

test('unignored sample names do not block actually ignored archive and stage paths', async t => {
  const { source, destination } = await fixture(t);
  for (const root of [source, destination]) execFileSync('git', ['init', '-q', root]);
  await writeFile(path.join(source, '.gitignore'), 'user-memory-backup-*.tar.gz\n!user-memory-backup-sample.tar.gz\n');
  await writeFile(path.join(destination, '.gitignore'), '/.private-user-memory-*/\n!/.private-user-memory-sample/\n');
  const { archive } = await backupUserMemory({ repoDir: source, timestamp: 'fixed' });
  await restoreUserMemory({ archive, repoDir: destination });
  assert.equal(await readFile(path.join(destination, users, 'user_pref.md'), 'utf8'), 'private bytes\n');
  execFileSync('git', ['-C', source, 'check-ignore', '-q', '--no-index', archive]);
});

for (const exposed of [false, true])
  test(`Git restore of a users symlink ${exposed ? 'rolls back on exposed member' : 'preserves force replacement'}`, async t => {
    const { root, source, destination } = await fixture(t);
    const { archive } = await backupUserMemory({ repoDir: source });
    execFileSync('git', ['init', '-q', destination]);
    const external = path.join(root, 'external');
    await mkdir(external);
    await writeFile(path.join(external, 'keep'), 'external bytes');
    await mkdir(path.join(destination, '.harness/memory'), { recursive: true });
    await symlink(external, path.join(destination, users));
    if (exposed) {
      await exposePrivateMember(destination, 'user_pref.md');
      await assert.rejects(restoreUserMemory({ archive, repoDir: destination, force: true }), /private-ignore/);
      assert.equal((await lstat(path.join(destination, users))).isSymbolicLink(), true);
    } else {
      await restoreUserMemory({ archive, repoDir: destination, force: true });
      assert.equal((await lstat(path.join(destination, users))).isSymbolicLink(), false);
      assert.equal(await readFile(path.join(destination, users, 'user_pref.md'), 'utf8'), 'private bytes\n');
    }
    assert.equal(await readFile(path.join(external, 'keep'), 'utf8'), 'external bytes');
  });
