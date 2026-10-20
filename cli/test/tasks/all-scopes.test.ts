import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { run } from '../../src/program.js';
import { AgentsNode, ReadmeNode, TaskNode } from '../../src/domain/models/index.js';

const maintenancePaths = [
  '.harness/tasks/alpha/todo/same/INDEX.md',
  'child/.harness/tasks/alpha/todo/same/INDEX.md',
  'notes/example/.harness/tasks/beta/done/same/INDEX.md',
  'tasks/alpha/todo/same/.harness/tasks/alpha/todo/same/INDEX.md',
  'tasks/alpha/todo/same/.harness/tasks/alpha/todo/same/.harness/tasks/alpha/todo/same/INDEX.md',
];
const rootDomainPath = 'tasks/alpha/todo/same/INDEX.md';
const childMaintenancePath = '.harness/tasks/alpha/todo/same/INDEX.md';

function fixture(t: { after(fn: () => void): void }, git = true) {
  const root = mkdtempSync(path.join(realpathSync(tmpdir()), 'all-scopes-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  if (git) execFileSync('git', ['init', '-q', root]);
  const write = (rel: string, body: string) => {
    const file = path.join(root, rel);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, body);
  };
  const index = (rel: string, local: string[], descendants: string[] = []) => {
    const file = path.join(root, rel);
    const refs = (ids: string[]) => ids.map(id => ({ id: path.resolve(path.dirname(file), id) }));
    const node = rel.endsWith('AGENTS.md') ? new AgentsNode(file) : new ReadmeNode(file);
    write(rel, '# Project\n\nDescription\n\n' + node.create({
      localChildren: refs(local), descendantChildren: refs(descendants),
    }, { operation: 'create' }).serialize());
  };
  const board = (scope: string, rel: string, project = 'alpha', status: 'todo' | 'done' = 'todo') => {
    const entry = path.join(scope, rel, project, status, 'same/INDEX.md');
    index(path.join(scope, rel, 'README.md'), [`${project}/README.md`, 'empty/README.md']);
    index(path.join(scope, rel, project, 'README.md'), [`${status}/same/INDEX.md`]);
    index(path.join(scope, rel, 'empty/README.md'), []);
    write(entry, new TaskNode(path.join(root, entry)).create({
      name: 'Same', status,
      metadata: { metadata: { 'edges-task-project': project, 'edges-task-priority': scope === 'child' ? 'high' : 'low' } },
    }, { operation: 'create' }).serialize());
  };
  for (const scope of ['.', 'child', 'notes/example', 'tasks/alpha/todo/same', 'tasks/alpha/todo/same/.harness/tasks/alpha/todo/same']) {
    index(path.join(scope, 'AGENTS.md'), ['.harness/tasks/README.md']);
    board(scope, '.harness/tasks', scope === 'notes/example' ? 'beta' : 'alpha', scope === 'notes/example' ? 'done' : 'todo');
    if (scope === '.' || scope === 'child') board(scope, 'tasks');
  }
  // A valid unrelated leaf lets forest queries exercise traversal rather than YAML failure.
  write('notes/example/INDEX.md', '---\nname: Example\ndescription: Unrelated note\n---\n\n# Example\n');
  index('AGENTS.md', ['.harness/tasks/README.md', 'notes/example/INDEX.md', 'aliases/AGENTS.md', '.harness/observation/README.md'], ['child/AGENTS.md', 'missing/AGENTS.md']);
  index('aliases/AGENTS.md', ['../child/AGENTS.md']);
  const call = (scope: string, args: string[]) => {
    const flags = args.filter(arg => arg === '--super' || arg === '--all');
    const rest = args.filter(arg => arg !== '--super' && arg !== '--all');
    return run(['--scope', path.join(root, scope), ...flags, 'tasks', ...rest], { env: {} });
  };
  return { root, call, write };
}

async function listed(call: ReturnType<typeof fixture>['call'], scope: string, args: string[] = []) {
  const result = await call(scope, ['list', ...args]);
  assert.equal(result.exitCode, 0, result.stdout + result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.status, 'success');
  assert.equal(payload.command, 'list');
  return payload;
}

function assertPaths(tasks: Array<{ path: string }>, expected: string[]) {
  assert.deepEqual(tasks.map(task => task.path).sort(), [...expected].sort());
  assert.equal(new Set(tasks.map(task => task.path)).size, tasks.length);
}

function fileSnapshot(root: string): Array<[string, string]> {
  return readdirSync(root, { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry => path.join(entry.parentPath, entry.name))
    .sort()
    .map(file => [path.relative(root, file), readFileSync(file).toString('base64')]);
}

test('default list follows registered local and descendant children and preserves duplicate-title identities', async t => {
  const { call } = fixture(t);
  const root = await listed(call, '.');
  assertPaths(root.tasks, maintenancePaths.slice(0, 2));
  assert.deepEqual(root.tasks.map((task: any) => ({
    stem: task.stem, title: task.title, status: task.status, priority: task.priority, project: task.project,
  })), [
    { stem: 'same', title: 'Same', status: 'todo', priority: 'low', project: 'alpha' },
    { stem: 'same', title: 'Same', status: 'todo', priority: 'high', project: 'alpha' },
  ]);
  assert.ok(root.tasks.every((task: any) => !('doc' in task)));
  assertPaths((await listed(call, 'child')).tasks, [childMaintenancePath]);
});

test('--all scans systems beneath the selected scope without widening to the Git root', async t => {
  const { root, call } = fixture(t);
  assertPaths((await listed(call, '.', ['--all'])).tasks, maintenancePaths);
  assertPaths((await listed(call, 'child', ['--all'])).tasks, [childMaintenancePath]);
  const oldCwd = process.cwd();
  try {
    process.chdir(path.join(root, 'child'));
    const result = await run(['--all', 'tasks', 'list'], { env: {} });
    assert.equal(result.exitCode, 0, result.stdout);
    assertPaths(JSON.parse(result.stdout).tasks, [childMaintenancePath]);
  } finally { process.chdir(oldCwd); }
});

test('--super mounts the configured material face and --super --all also collects scoped systems', async t => {
  const { call } = fixture(t);
  assertPaths((await listed(call, '.', ['--super'])).tasks, [rootDomainPath]);
  assertPaths((await listed(call, '.', ['--super', '--all'])).tasks, [rootDomainPath, ...maintenancePaths]);
  assertPaths((await listed(call, 'child', ['--super', '--all'])).tasks, [rootDomainPath, childMaintenancePath]);
});

test('forest grouping, status, priority and project filters retain task paths and current fields', async t => {
  const { call } = fixture(t);
  const grouped = await listed(call, '.', ['--all', '--group-by', 'project']);
  assert.equal(grouped.groupBy, 'project');
  assert.deepEqual(grouped.groups.map((group: any) => group.key).sort(), ['alpha', 'beta']);
  assertPaths(grouped.groups.flatMap((group: any) => group.items), maintenancePaths);
  assertPaths(grouped.groups.find((group: any) => group.key === 'alpha').items, maintenancePaths.filter(task => !task.includes('/beta/')));
  assertPaths(grouped.groups.find((group: any) => group.key === 'beta').items, [maintenancePaths[2]!]);
  const filtered = await listed(call, '.', ['--all', '--status', 'todo', '--priority', 'high', '--project', 'alpha', '--sort', 'priority']);
  assertPaths(filtered.tasks, ['child/.harness/tasks/alpha/todo/same/INDEX.md']);
  assertPaths((await listed(call, '.', ['--all', '--status', 'done'])).tasks, [maintenancePaths[2]!]);
  assertPaths((await listed(call, '.', ['--all', '--project', 'beta'])).tasks, [maintenancePaths[2]!]);
  assert.equal((await listed(call, '.', ['--all', '--priority', 'high', '--project', 'beta'])).tasks.length, 0);
  assert.deepEqual((await listed(call, '.', ['--all', '--sort', 'priority'])).tasks.map((task: any) => task.priority), ['high', 'low', 'low', 'low', 'low']);
  const empty = await listed(call, '.', ['--all', '--status', 'done', '--project', 'empty', '--group-by', 'project']);
  assert.deepEqual(empty.groups, []);
});

test('write commands reject --all', async t => {
  for (const args of [['create', '--title', 'No'], ['update', 'same', '--title', 'No'], ['status', 'same', 'done']]) {
    await t.test(args[0]!, async t => {
      const { root, call } = fixture(t);
      const before = fileSnapshot(root);
      const result = await call('.', [...args, '--all']);
      assert.equal(result.exitCode, 2, result.stdout);
      assert.match(result.stdout + result.stderr, /--all/);
      assert.deepEqual(fileSnapshot(root), before);
      assert.ok(!readdirSync(root).includes('.edges-write.lock'));
    });
  }
});

test('without Git, missing registered children skip and --all discovers systems without a top-level AGENTS', async t => {
  const { call, root, write } = fixture(t, false);
  assertPaths((await listed(call, 'child', ['--all'])).tasks, [childMaintenancePath]);
  write('unregistered/tasks/AGENTS.md', '# Not a system entry\n');
  assertPaths((await listed(call, '.', ['--all'])).tasks, maintenancePaths);
  rmSync(path.join(root, 'child/.harness/tasks/alpha/README.md'));
  assertPaths((await listed(call, '.')).tasks, [maintenancePaths[0]!]);
  const remaining = maintenancePaths.filter(task => !task.startsWith('child/'));
  assertPaths((await listed(call, '.', ['--all'])).tasks, remaining);
  rmSync(path.join(root, 'AGENTS.md'));
  assertPaths((await listed(call, '.', ['--all'])).tasks, remaining.slice(1));
  assertPaths((await listed(call, '.')).tasks, [maintenancePaths[0]!]);
  // Remove the existing task-board fallback as well before asserting an absent root.
  rmSync(path.join(root, '.harness/tasks/README.md'));
  const missing = await call('.', ['list']);
  assert.notEqual(missing.exitCode, 0);
  assert.match(missing.stdout, /Missing scope entry/);
});

test('forest traversal reports malformed unrelated content instead of returning partial success', async t => {
  const { call, write } = fixture(t);
  write('notes/example/INDEX.md', '---\nbad: [\n---\n');
  const result = await call('.', ['list', '--all']);
  assert.notEqual(result.exitCode, 0);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.status, 'failed');
  assert.match(payload.reason, /notes\/example\/INDEX\.md/);
});
