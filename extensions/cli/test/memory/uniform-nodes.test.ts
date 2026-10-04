import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveScope, isScope, discoverScopes } from '../../src/services/scope.js';
import { initMemory, doctorMemory, rememberMemory } from '../../src/services/memory/index.js';
import { NodeService } from '../../src/services/node-service.js';
import { rewriteRootAgents, parseProjectAgents, updateProject } from '../../src/services/tasks/project-meta.js';
import { nodeBoardWriter } from '../tasks/utils/helpers.js';
function fixture(t: any) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'uniform-nodes-')));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}
function put(root: string, file: string, text: string) {
  mkdirSync(join(root, file, '..'), { recursive: true });
  writeFileSync(join(root, file), text);
}
const read = (root: string, file: string) => readFileSync(join(root, file), 'utf8');
test('nearest unmarked, type and business AGENTS are CLI nodes without adopting Memory', async t => {
  const root = fixture(t);
  mkdirSync(join(root, '.git'));
  for (const [dir, text] of [['plain', '# Plain\n'], ['plain/type', '<!-- project-memory-entries:start -->\n<!-- project-memory-entries:end -->\n'], ['tasks', '# Business\n']]) {
    put(root, `${dir}/AGENTS.md`, text);
    assert.equal(isScope(join(root, dir)), true);
    assert.equal(resolveScope({}, join(root, dir)), join(root, dir));
  }
  assert.equal(discoverScopes(root).length, 4);
  const target = resolveScope({}, root, 'uninitialized');
  mkdirSync(target);
  assert.equal((await initMemory({ targetDir: target, rootDir: target })).selectionRequired, true);
  await assert.rejects(rememberMemory({ targetDir: target, type: 'project', slug: 'no', content: 'no' }), /type|init|初始化/i);
  assert.equal(existsSync(join(target, '.harness')), false);
});
test('Doctor preserves sparse generic nodes and registered cross-directory local and descendant ownership', async t => {
  const root = fixture(t);
  await initMemory({ targetDir: root, memoryTypes: ['project'] });
  put(root, 'business/AGENTS.md', '# Business\n\n## 本层记忆\n- [shared](../shared/AGENTS.md) — shared content\n\n## 下层记忆索引\n- [deep](../nested/deep/AGENTS.md) — custom descendant\n\n## Authored\n[ordinary](../unowned/AGENTS.md)\n');
  put(root, 'shared/AGENTS.md', '# Shared\n');
  put(root, 'nested/AGENTS.md', '# Physical intermediate\n');
  mkdirSync(join(root, 'nested/deep'), { recursive: true });
  await initMemory({ targetDir: join(root, 'nested/deep'), rootDir: join(root, 'nested/deep'), memoryTypes: ['project'] });
  put(root, 'unowned/AGENTS.md', '# Unowned\n');
  const files = ['AGENTS.md', 'business/AGENTS.md', 'shared/AGENTS.md', 'nested/AGENTS.md', 'nested/deep/AGENTS.md', 'unowned/AGENTS.md', '.harness/memory/projects/AGENTS.md'];
  const before = files.map(file => read(root, file));
  const report = await doctorMemory({ targetDir: root, apply: true });
  assert.deepEqual(report.remaining, []);
  assert.deepEqual(files.map(file => read(root, file)), before);
  const service = new NodeService();
  const local = await service.list(join(root, 'business'));
  assert.deepEqual(local.map(node => node.path), [join(root, 'business/AGENTS.md'), join(root, 'shared/AGENTS.md')]);
  const all = await service.list(join(root, 'business'), { includeDescendants: true });
  assert.deepEqual(all.map(node => node.path), [join(root, 'business/AGENTS.md'), join(root, 'shared/AGENTS.md'), join(root, 'nested/deep/AGENTS.md'), join(root, 'nested/deep/.harness/memory/projects/AGENTS.md')]);
});
test('Task Project index lives once in local ownership while preserving authored sections', async t => {
  const root = fixture(t);
  const source = '# Board\n\n<!-- project-memory-local:start -->\n## 本层记忆\n\n- [guide](guide.md) — authored\n<!-- project-memory-local:end -->\n\n## Authored\nkeep this\n';
  const project = { project: 'demo', dir: 'demo', title: 'Demo', description: 'Business purpose', path: 'tasks/demo/AGENTS.md' };
  put(root, 'tasks/AGENTS.md', rewriteRootAgents(source, [project]));
  put(root, 'tasks/guide.md', 'guide');
  const tail = '\n<!-- project-memory:start -->\n<!-- project-memory-local:start -->\n## 本层记忆\n\n- [guide](../guide.md) — shared guide\n<!-- project-memory-local:end -->\n<!-- project-memory:end -->\n\n## Authored\nkeep exactly\n';
  put(root, 'tasks/demo/AGENTS.md', '# Demo\n\nBusiness purpose\n' + tail);
  const parsed = parseProjectAgents(read(root, 'tasks/demo/AGENTS.md'));
  assert.equal(parsed.description, 'Business purpose');
  await updateProject(root, 'demo', { title: 'New title' }, nodeBoardWriter());
  assert.ok(read(root, 'tasks/demo/AGENTS.md').endsWith(tail));
  const index = read(root, 'tasks/AGENTS.md');
  assert.match(index, /## Authored\nkeep this/);
  assert.doesNotMatch(index, /## Task Projects/);
  assert.equal(index.split('](demo/AGENTS.md)').length - 1, 1);
  const node = (await new NodeService().list(join(root, 'tasks')))[0]!;
  assert.ok(node.children.some(child => child.target === 'demo/AGENTS.md' && child.kind === 'local'));
  assert.equal(rewriteRootAgents(index, [project]), rewriteRootAgents(rewriteRootAgents(index, [project]), [project]));
});
test('sparse Task Project markers are local content and a heading-only local section is reused', async t => {
  const root = fixture(t);
  put(root, 'AGENTS.md', '# Board\n<!-- task-projects:start -->\n## Task Projects\n\n- [demo](demo/AGENTS.md) — business\n<!-- task-projects:end -->\n');
  put(root, 'demo/AGENTS.md', '# Demo\n');
  assert.equal((await new NodeService().list(root)).length, 2);
  const source = '# Board\n\n## 本层记忆\n\nManual local prose.\n\n## Authored\nKeep me.\n';
  const updated = rewriteRootAgents(source, [{ project: 'demo', dir: 'demo', title: 'Demo', description: 'Business', path: 'demo/AGENTS.md' }]);
  assert.equal(updated.split('## 本层记忆').length - 1, 1);
  assert.match(updated, /## Authored\nKeep me\./);
});
test('explicit init keeps an existing local owner and updates an explicitly supplied description', async t => {
  const root = fixture(t);
  put(root, 'AGENTS.md', '# Root\n\n## 本层记忆\n- [owned](physical/deep/AGENTS.md) — old description\n');
  put(root, 'physical/AGENTS.md', '# Physical parent\n');
  put(root, 'physical/deep/AGENTS.md', '# Owned\n');
  const result = await initMemory({ targetDir: join(root, 'physical/deep'), rootDir: root, memoryTypes: ['project'], description: 'Updated description' });
  assert.equal(result.indexAnchor, root);
  assert.match(read(root, 'AGENTS.md'), /Updated description/);
  assert.doesNotMatch(read(root, 'AGENTS.md'), /project-memory-children/);
  assert.equal(read(root, 'physical/AGENTS.md'), '# Physical parent\n');
});
