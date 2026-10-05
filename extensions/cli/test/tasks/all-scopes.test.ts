import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { run } from '../../src/program.js';
import { InternalNode, TaskNode } from '../../src/models/index.js';
import { generateTasksSite } from '../../src/services/tasks/generate-site.js';

function fixture(t: { after(fn: () => void): void }, git = true) {
  const root = mkdtempSync(path.join(realpathSync(tmpdir()), 'all-scopes-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  if (git) execFileSync('git', ['init', '-q', root]);
  const write = (rel: string, body: string) => {
    const file = path.join(root, rel); mkdirSync(path.dirname(file), { recursive: true }); writeFileSync(file, body);
  };
  const index = (rel: string, children: string[]) => {
    const file = path.join(root, rel);
    write(rel, '# Project\n\nDescription\n\n' + new InternalNode(file).create({ localChildren: children.map(id => ({ id: path.resolve(path.dirname(file), id) })) }, { operation: 'create' }).serialize());
  };
  const scopes = ['.', 'child', 'notes/example', 'tasks/alpha/todo/same', 'tasks/alpha/todo/same/.harness/tasks/alpha/todo/same'];
  const entries: string[] = [];
  for (const scope of scopes) {
    const purposes = scope === '.' || scope === 'child' ? ['tasks', '.harness/tasks'] : ['.harness/tasks'];
    index(path.join(scope, 'AGENTS.md'), purposes.map(board => `${board}/AGENTS.md`));
    for (const board of purposes) {
      const rel = path.join(scope, board, 'alpha/todo/same/index.md'); entries.push(rel);
      index(path.join(scope, board, 'AGENTS.md'), ['alpha/AGENTS.md', 'empty/AGENTS.md']);
      index(path.join(scope, board, 'alpha/AGENTS.md'), ['todo/same/index.md']);
      index(path.join(scope, board, 'empty/AGENTS.md'), []);
      write(rel, new TaskNode(path.join(root, rel)).create({ name: 'Same', status: 'todo', metadata: { metadata: { 'edges-task-project': 'alpha', 'edges-task-priority': scope === 'child' ? 'high' : 'low' } } }, { operation: 'create' }).serialize());
    }
  }
  // A non-Task entry must remain traversable without loading its malformed content.
  write('notes/example/index.md', '---\nbad: [\n---\n');
  index('AGENTS.md', ['tasks/AGENTS.md', '.harness/tasks/AGENTS.md', 'child/AGENTS.md', 'notes/example/index.md', 'aliases/AGENTS.md']);
  index('aliases/AGENTS.md', ['../child/AGENTS.md']);
  const call = (scope: string, args: string[]) => run(['--scope', path.join(root, scope), 'tasks', ...args], { env: {} });
  return { root, entries, call, write, index };
}

test('all-scopes resolves the Git root, preserves physical identities and matches dashboard payload', async t => {
  const { root, entries, call } = fixture(t);
  const outPath = path.join(root, 'site/index.html');
  await generateTasksSite({ repoPath: root, purpose: 'all', outPath });
  const dashboard = JSON.parse(readFileSync(outPath, 'utf8').match(/<script type="application\/json" id="edges-review-payload">([\s\S]*?)<\/script>/)![1]!);
  for (const scope of ['.', 'child']) {
    const result = await call(scope, ['list', '--all-scopes']);
    assert.equal(result.exitCode, 0, result.stdout);
    const payload = JSON.parse(result.stdout);
    assert.equal(payload.status, 'success'); assert.equal(payload.command, 'list');
    assert.deepEqual(payload.tasks.map((x: any) => x.path).sort(), entries.sort());
    assert.ok(payload.tasks.every((x: any) => !('doc' in x)));
    const local = JSON.parse((await call(scope, ['list'])).stdout);
    assert.equal(local.tasks.length, 1); assert.match(local.tasks[0].path, /^\.harness\/tasks\//);
    const grouped = await call(scope, ['list', '--all-scopes', '--group-by', 'project']);
    assert.equal(grouped.exitCode, 0, grouped.stdout);
    const snapshot = JSON.parse(grouped.stdout);
    assert.equal(snapshot.schema, 'edges.tasks.grouped/v1');
    assert.deepEqual(snapshot.items.map((x: any) => x.id).sort(), dashboard.items.map((x: any) => x.id).sort());
    assert.equal(new Set(snapshot.items.map((x: any) => x.id)).size, 7);
    assert.equal(snapshot.groups.length, 14);
    assert.deepEqual(snapshot.items.map((x: any) => x.path).sort(), entries.sort());
  }
  const oldCwd = process.cwd();
  try { process.chdir(path.join(root, 'child')); const result = await run(['tasks', 'list', '--all-scopes'], { env: {} }); assert.equal(result.exitCode, 0, result.stdout); assert.equal(JSON.parse(result.stdout).tasks.length, 7); }
  finally { process.chdir(oldCwd); }
});

test('explicit purpose and existing filters apply to the repository collection', async t => {
  const { call } = fixture(t);
  const domain = await call('child', ['--purpose', 'domain', 'list', '--all-scopes']);
  assert.equal(domain.exitCode, 0, domain.stdout);
  assert.equal(JSON.parse(domain.stdout).tasks.length, 2);
  const maintenance = await call('.', ['--purpose', 'maintenance', 'list', '--all-scopes']);
  assert.equal(maintenance.exitCode, 0, maintenance.stdout);
  assert.equal(JSON.parse(maintenance.stdout).tasks.length, 5);
  const filtered = await call('.', ['list', '--all-scopes', '--status', 'todo', '--priority', 'high', '--project', 'alpha', '--sort', 'priority']);
  assert.equal(filtered.exitCode, 0, filtered.stdout);
  assert.deepEqual(JSON.parse(filtered.stdout).tasks.map((x: any) => x.source.scope), ['child', 'child']);
  const sorted = JSON.parse((await call('.', ['list', '--all-scopes', '--sort', 'priority'])).stdout);
  assert.deepEqual(sorted.tasks.slice(0, 2).map((x: any) => x.priority), ['high', 'high']);
  const empty = JSON.parse((await call('.', ['list', '--all-scopes', '--status', 'done', '--project', 'empty', '--group-by', 'project'])).stdout);
  assert.equal(empty.items.length, 0); assert.equal(empty.groups.length, 7);
  for (const args of [['create', '--title', 'No'], ['update', 'same', '--title', 'No'], ['status', 'same', 'done']]) {
    assert.equal((await call('.', [...args, '--all-scopes'])).exitCode, 2);
  }
});

test('no Git uses the resolved scope and missing repository entry never scans', async t => {
  const { call, root, write } = fixture(t, false);
  const result = await call('child', ['list', '--all-scopes']);
  assert.equal(result.exitCode, 0, result.stdout); assert.equal(JSON.parse(result.stdout).tasks.length, 2);
  write('unregistered/tasks/AGENTS.md', '# Invalid but undiscoverable\n');
  const known = await call('.', ['list', '--all-scopes']);
  assert.equal(known.exitCode, 0, known.stdout); assert.equal(JSON.parse(known.stdout).tasks.length, 7);
  rmSync(path.join(root, 'child/tasks/alpha/AGENTS.md'));
  const missingChild = await call('.', ['list', '--all-scopes']);
  assert.notEqual(missingChild.exitCode, 0); assert.match(missingChild.stdout, /Missing referenced node/);
  rmSync(path.join(root, 'AGENTS.md'));
  const missing = await call('.', ['list', '--all-scopes']);
  assert.notEqual(missing.exitCode, 0); assert.match(missing.stdout, /AGENTS|entry|index/i);
});
