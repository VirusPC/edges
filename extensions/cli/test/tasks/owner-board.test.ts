import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { run } from '../../src/program.js';
import { InternalNode } from '../../src/domain/models/index.js';
import { generateTasksSite } from '../../src/services/tasks/generate-site.js';

function fixture(t: { after(fn: () => void): void }) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(tmpdir()), 'owner-board-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  execFileSync('git', ['init', '-q', root]);
  const write = (rel: string, source: string) => {
    const file = path.join(root, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, source);
  };
  const call = (scope: string, purpose: string, args: string[]) => run(['--scope', path.join(root, scope), 'tasks', '--index-group', purpose === 'domain' ? 'descendant' : 'local', '--purpose', purpose, ...args], { env: {} });
  const read = (scope: string) => new InternalNode(path.join(root, scope, 'AGENTS.md')).parse(fs.readFileSync(path.join(root, scope, 'AGENTS.md'), 'utf8'));
  return { root, write, call, read };
}

test('CLI first projects and tasks connect existing root, child and content scopes to global CLI and HTML', async t => {
  const { root, write, call, read } = fixture(t);
  const owner = new InternalNode(path.join(root, 'AGENTS.md')).parse('# Scope\n\nHuman introduction\n');
  owner.setConstraints(['Keep this']);
  owner.addChild('descendant', { id: path.join(root, 'child/AGENTS.md'), name: 'Child', description: 'Authored child' });
  owner.addChild('local', { id: path.join(root, 'notes/example/index.md'), name: 'Note' });
  write('AGENTS.md', owner.serialize());
  write('child/AGENTS.md', '# Child\n\nChild prose\n');
  write('notes/example/index.md', '# Content\n');
  write('notes/example/AGENTS.md', '# Content maintenance\n\nKeep content harness prose\n');
  const expected: string[] = [];
  for (const scope of ['.', 'child', 'notes/example']) {
    for (const purpose of ['maintenance', 'domain']) {
      const project = await call(scope, purpose, ['project', 'create', 'empty', '--title', 'Empty', '--description', 'No tasks yet']);
      assert.equal(project.exitCode, 0, project.stdout);
      const globalEmpty = await run(['--scope', root, 'tasks', "--index-group", "local", 'list', '--all-scopes', '--group-by', 'project'], { env: {} });
      assert.equal(globalEmpty.exitCode, 0, globalEmpty.stdout);
      assert.equal(globalEmpty.exitCode, 0, globalEmpty.stdout);
      assert.equal(JSON.parse(globalEmpty.stdout).groupBy, "project");
      const created = await call(scope, purpose, ['create', '--title', 'Same']);
      assert.equal(created.exitCode, 0, created.stdout);
      expected.push(path.join(scope, JSON.parse(created.stdout).path));
      const local = await call(scope, purpose, ['list']);
      assert.equal(local.exitCode, 0, local.stdout); assert.equal(JSON.parse(local.stdout).tasks.length, 1);
    }
  }
  const global = await run(['--scope', root, 'tasks', "--index-group", "local", 'list', '--all-scopes', '--group-by', 'project'], { env: {} });
  assert.equal(global.exitCode, 0, global.stdout);
  const payload = JSON.parse(global.stdout);
  const items = payload.groups.flatMap((group: { items: Array<{ path: string }> }) => group.items);
  assert.deepEqual(items.map((item) => item.path).sort(), expected.sort());
  assert.equal(new Set(items.map((item) => item.path)).size, 6);
  const outPath = path.join(root, 'site/index.html');
  await generateTasksSite({ repoPath: root, purpose: 'all', outPath });
  const html = JSON.parse(fs.readFileSync(outPath, 'utf8').match(/<script type="application\/json" id="edges-review-payload">([\s\S]*?)<\/script>/)![1]!);
  assert.equal(html.items.length, items.length);
  for (const scope of ['.', 'child', 'notes/example']) {
    const node = read(scope);
    assert.ok(node.localChildren.some(ref => ref.id === path.join(root, scope, '.harness/tasks/AGENTS.md')));
    assert.ok(node.descendantChildren.some(ref => ref.id === path.join(root, scope, 'tasks/AGENTS.md')));
    assert.ok(!fs.existsSync(path.join(root, scope, '.harness/AGENTS.md')));
  }
  assert.deepEqual(read('.').constraints, ['Keep this']);
  assert.deepEqual(read('.').descendantChildren.find(ref => ref.id === path.join(root, 'child/AGENTS.md')), owner.descendantChildren[0]);
  assert.match(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), /Human introduction/);
  assert.match(fs.readFileSync(path.join(root, 'child/AGENTS.md'), 'utf8'), /Child prose/);
  assert.match(fs.readFileSync(path.join(root, 'notes/example/AGENTS.md'), 'utf8'), /Keep content harness prose/);
});

for (const domainGroup of ['local', 'descendant'] as const)
  test('existing board labels and domain ' + domainGroup + ' relation remain unchanged across repeated writes', async t => {
    const { root, write, call, read } = fixture(t);
    const node = new InternalNode(path.join(root, 'AGENTS.md')).parse('# Scope\n\nIntro\n');
    node.setConstraints(['Rule']);
    node.addChild(domainGroup, { id: path.join(root, 'tasks/AGENTS.md'), name: 'Domain label', description: 'Domain description' });
    node.addChild('local', { id: path.join(root, '.harness/tasks/AGENTS.md'), name: 'Maintenance label', description: 'Maintenance description' });
    const source = node.serialize() + '\nTail\n'; write('AGENTS.md', source);
    for (const purpose of ['domain', 'maintenance']) for (const title of ['First', 'Second']) {
      const result = await call('.', purpose, ['create', '--title', title]);
      assert.equal(result.exitCode, 0, result.stdout);
    }
    assert.equal(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), source);
    assert.equal(read('.').children.length, 2);
  });

test('fresh scope writes remain authorized without initializing Project Memory or a root index', async t => {
  const { root, call } = fixture(t);
  for (const purpose of ['maintenance', 'domain']) {
    const result = await call('.', purpose, ['create', '--title', 'Fresh']);
    assert.equal(result.exitCode, 0, result.stdout);
    assert.equal(JSON.parse((await call('.', purpose, ['list'])).stdout).tasks.length, 1);
  }
  assert.ok(!fs.existsSync(path.join(root, 'AGENTS.md')));
  assert.ok(!fs.existsSync(path.join(root, '.harness/memory')));
  const global = await run(['--scope', root, 'tasks', "--index-group", "local", 'list', '--all-scopes'], { env: {} });
  assert.notEqual(global.exitCode, 0);
});

test('first task creation registers both purposes without an earlier project command', async t => {
  const { root, write, call, read } = fixture(t);
  const owner = new InternalNode(path.join(root, 'AGENTS.md')).parse('# Root\n');
  owner.addChild('descendant', { id: path.join(root, 'child/AGENTS.md') });
  write('AGENTS.md', owner.serialize()); write('child/AGENTS.md', '# Child\n');
  const expected: string[] = [];
  for (const scope of ['.', 'child']) for (const purpose of ['maintenance', 'domain']) {
    const created = await call(scope, purpose, ['create', '--title', 'First']);
    assert.equal(created.exitCode, 0, created.stdout);
    expected.push(path.join(scope, JSON.parse(created.stdout).path));
  }
  const global = await run(['--scope', root, 'tasks', "--index-group", "local", 'list', '--all-scopes'], { env: {} });
  assert.equal(global.exitCode, 0, global.stdout);
  assert.deepEqual(JSON.parse(global.stdout).tasks.map((x: any) => x.path).sort(), expected.sort());
  assert.equal(read('.').localChildren.length, 1);
});

test('maintenance registration preserves an existing descendant relation and authored metadata', async t => {
  const { root, write, call, read } = fixture(t);
  const node = new InternalNode(path.join(root, 'AGENTS.md')).parse('# Root\n\nKeep prose\n');
  const reference = { id: path.join(root, '.harness/tasks/AGENTS.md'), name: 'My upkeep', description: 'Keep description' };
  node.addChild('descendant', reference);
  write('AGENTS.md', node.serialize());
  const result = await call('.', 'maintenance', ['create', '--title', 'First']);
  assert.equal(result.exitCode, 0, result.stdout);
  assert.deepEqual(read('.').localChildren, []);
  assert.deepEqual(read('.').descendantChildren, [reference]);
});

test('unsafe owner indexes are refused without overwriting their source', async t => {
  const { root, write, call } = fixture(t);
  const source = '# Root\n<!-- project-memory-local:start -->\n';
  write('AGENTS.md', source);
  const result = await call('.', 'maintenance', ['create', '--title', 'Refused']);
  assert.notEqual(result.exitCode, 0);
  assert.equal(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), source);
  assert.ok(!fs.existsSync(path.join(root, '.harness/tasks/_default/backlog')));
});

test('new owner registration requires explicit group and preserves purpose-independent choice', async t => {
  const { root, write, read } = fixture(t);
  write('AGENTS.md', '# Owner\n');
  const args = ['--scope', root, 'tasks', '--purpose', 'maintenance', 'project', 'create', 'example', '--title', 'Example', '--description', 'Description'];
  const missing = await run(args, { env: {} });
  assert.notEqual(missing.exitCode, 0);
  assert.equal(fs.existsSync(path.join(root, '.harness')), false);
  const created = await run([...args.slice(0, 5), '--index-group', 'descendant', ...args.slice(5)], { env: {} });
  assert.equal(created.exitCode, 0, created.stdout);
  assert.equal(read('.').descendantChildren[0]?.id, path.join(root, '.harness/tasks/AGENTS.md'));
  const board = new InternalNode(path.join(root, '.harness/tasks/AGENTS.md')).parse(fs.readFileSync(path.join(root, '.harness/tasks/AGENTS.md'), 'utf8'));
  assert.equal(board.localChildren.filter(ref => ref.name === 'Example').length, 1);
  assert.doesNotMatch(board.serialize(), /task-projects:/);
});

for (const group of ['local', 'descendant'] as const) test('existing board registers missing owner relation as ' + group, async t => {
  const { root, write, read } = fixture(t);
  const owner = new InternalNode(path.join(root, 'AGENTS.md')).parse('# Owner\n\nKeep prose\n');
  owner.setConstraints(['Keep rule']);
  owner.addChild('local', { id: path.join(root, 'other/AGENTS.md'), name: 'Authored', description: 'Keep' });
  write('AGENTS.md', owner.serialize()); write('other/AGENTS.md', '# Other\n');
  write('tasks/AGENTS.md', '# Existing board\n<!-- project-memory-local:start -->\n<!-- project-memory-local:end -->\n');
  const result = await run(['--scope', root, 'tasks', '--purpose', 'domain', '--index-group', group, 'project', 'create', 'example', '--title', 'Example', '--description', 'Description'], { env: {} });
  assert.equal(result.exitCode, 0, result.stdout);
  const updated = read('.');
  assert.ok((group === 'local' ? updated.localChildren : updated.descendantChildren).some(ref => ref.id === path.join(root, 'tasks/AGENTS.md')));
  assert.deepEqual(updated.localChildren.find(ref => ref.id === path.join(root, 'other/AGENTS.md')), owner.localChildren[0]);
  assert.deepEqual(updated.constraints, ['Keep rule']);
  assert.match(updated.body, /Keep prose/);
});
