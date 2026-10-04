import test from 'node:test';
import assert from 'node:assert/strict';
import { realpathSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { run } from '../../src/program.js';
import { initMemory } from '../../src/services/memory/init.js';

function fixture(t: any) {
  const root = realpathSync(mkdtempSync(path.join(tmpdir(), 'production-nodes-')));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}
test('task update adds typed metadata to a headerless task and status preserves its runlog', async t => {
  const root = fixture(t), scope = path.join(root, 'nested');
  const folder = path.join(scope, 'tasks/_default/todo');
  mkdirSync(folder, { recursive: true });
  const stem = '2026-10-05--plain';
  writeFileSync(path.join(folder, `${stem}.md`), '# Original\n\nBody stays.\n');
  writeFileSync(path.join(folder, `.${stem}.log.md`), 'Run evidence\n');
  const call = (args: string[]) => run(['--scope', scope, 'tasks', ...args], { env: { EDGES_SCOPE: root } });
  const updated = await call(['update', stem, '--title', 'Typed title', '--priority', 'high']);
  assert.equal(updated.exitCode, 0, updated.stdout);
  const got = await call(['get', stem]);
  assert.match(got.stdout, /Typed title/);
  assert.match(got.stdout, /high/);
  const moved = await call(['status', stem, 'done']);
  assert.equal(moved.exitCode, 0, moved.stdout);
  assert.match(readFileSync(path.join(scope, 'tasks/_default/done', `${stem}.md`), 'utf8'), /Body stays/);
  assert.equal(readFileSync(path.join(scope, 'tasks/_default/done', `.${stem}.log.md`), 'utf8'), 'Run evidence\n');
});
test('memory remember rejects malformed domain metadata without erasing the original entry', async t => {
  const root = fixture(t);
  await initMemory({ targetDir: root, memoryTypes: ['project'] });
  const file = path.join(root, '.harness/memory/projects/project_example.md');
  const source = '---\nname: example\ndescription: Existing\nmetadata: malformed\n---\nOriginal\n';
  writeFileSync(file, source);
  const result = await run(['--scope', root, 'memory', 'remember', '--type', 'project', '--slug', 'example', '--title', 'Changed', '--description', 'Changed', '--content', 'Replacement'], { env: {} });
  assert.equal(result.exitCode, 1, result.stdout);
  assert.equal(readFileSync(file, 'utf8'), source);
});

test('note ingest refuses a linked destination before changing the outside note', async t => {
  const { symlinkSync } = await import('node:fs');
  const { runNoteIngest } = await import('../../src/services/note/git/ingest.js');
  const root = fixture(t), outside = fixture(t), date = new Date('2026-10-05T12:00:00Z');
  mkdirSync(path.join(root, 'knowledge/notes'), { recursive: true });
  const target = path.join(outside, 'source.md');
  writeFileSync(target, 'Outside original\n');
  symlinkSync(target, path.join(root, 'knowledge/notes/2026-10-05--hello.md'));
  await assert.rejects(() => runNoteIngest({ title: 'Hello', content: 'New body', coAuthor: 'Test <test@example.test>' },
    { repoPath: root, mode: 'direct', dryRun: true, baseBranch: 'main' }, {},
    { now: date, exec: async () => ({ stdout: '', stderr: '' }) }), /symbolic link/);
  assert.equal(readFileSync(target, 'utf8'), 'Outside original\n');
});

test('node creation rejects invalid permissions before creating a destination', async t => {
  const { NodeService } = await import('../../src/services/node-service.js');
  const { BaseNode } = await import('../../src/models/base-node.js');
  const { existsSync } = await import('node:fs');
  const file = path.join(fixture(t), 'private.md');
  const service = new NodeService({ createMode: () => -1 });
  await assert.rejects(() => service.create(new BaseNode(file).parse('body')), /mode|permission/i);
  assert.equal(existsSync(file), false);
});

test('ordinary CLI startup works without the optional legacy migration implementation', async t => {
  const { cpSync, symlinkSync } = await import('node:fs');
  const { fileURLToPath } = await import('node:url');
  const { execFileSync } = await import('node:child_process');
  const isolated = fixture(t), cli = fileURLToPath(new URL('../../', import.meta.url));
  cpSync(path.join(cli, 'src'), path.join(isolated, 'src'), { recursive: true });
  rmSync(path.join(isolated, 'src/services/memory/migrate.ts'));
  rmSync(path.join(isolated, 'src/services/memory/migration-legacy.ts'));
  symlinkSync(path.join(cli, 'node_modules'), path.join(isolated, 'node_modules'));
  writeFileSync(path.join(isolated, 'package.json'), '{"type":"module"}');
  const output = execFileSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e',
    "const {run}=await import('./src/program.ts'); const result=await run(['tasks','--help']); process.stdout.write(result.stdout); process.exitCode=result.exitCode;"],
    { cwd: isolated, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  assert.match(output, /create/);
});
