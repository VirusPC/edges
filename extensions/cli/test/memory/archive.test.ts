import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, stat, lstat, chmod, rm, symlink, realpath, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { Header, type HeaderData } from 'tar';
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
    const header = new Header({ type: 'File', mode: 0o600, ...fields, size: bytes.length });
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
