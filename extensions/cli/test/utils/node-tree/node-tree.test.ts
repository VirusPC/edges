import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync, existsSync, cpSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { walkTree, findAncestor, readNode, discoverNodes, readNodeTree } from '../../../src/utils/node-tree/index.js';

function fixture() {
  const root = mkdtempSync(path.join(tmpdir(), 'edges-node-tree-'));
  function node(relative: string, content = '# Node\n') {
    const dir = path.join(root, relative);
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, 'AGENTS.md'), content);
    return dir;
  }
  return { root, node, cleanup: () => rmSync(root, { recursive: true, force: true }) };
}
const children = (links: string) => `<!-- project-memory-children:start -->\n## 下层记忆索引\n${links}\n<!-- project-memory-children:end -->`;

test('generic traversal terminates cycles and visits shared descendants once in document order', () => {
  const graph: Record<string, string[]> = { root: ['a', 'b'], a: ['c'], b: ['c'], c: ['root'] };
  assert.deepEqual(walkTree('root', node => graph[node], node => node), ['root', 'a', 'c', 'b']);
  const many = walkTree(0, n => n < 20000 ? [n + 1] : [], String);
  assert.equal(many.length, 20001);
});

test('node identity does not require Project Memory adoption or a task board', () => {
  const f = fixture();
  try {
    const module = f.node('module', '# Module\n\nKeep local rules.');
    assert.equal(readNode(module)?.location.directory, module);
    assert.equal(readNode(f.root), undefined);
    assert.deepEqual(discoverNodes(f.root).map(node => node.location.directory), [module]);
  } finally { f.cleanup(); }
});

test('ancestor lookup uses caller predicates and an explicit stop boundary', () => {
  const f = fixture();
  try {
    f.node('');
    const child = f.node('a/b');
    assert.equal(findAncestor(child, dir => dir === f.root), f.root);
    assert.equal(findAncestor(child, dir => dir === f.root, dir => dir === path.join(f.root, 'a')), undefined);
    assert.equal(findAncestor(child, () => false), undefined);
  } finally { f.cleanup(); }
});

test('logical traversal follows only child links, skipping filesystem levels and duplicate links', () => {
  const f = fixture();
  try {
    f.node('', '# Root\n[Reference](reference/AGENTS.md)\n' + children('- [Child](deep/container/child/AGENTS.md)\n- [Again](deep/container/child/AGENTS.md#rules)'));
    const child = f.node('deep/container/child', children('- [Root](../../../AGENTS.md)'));
    f.node('reference');
    f.node('unregistered');
    assert.deepEqual(readNodeTree(f.root).map(node => node.location.directory), [f.root, child]);
    assert.deepEqual(readNode(f.root)?.links.references, [path.join(f.root, 'reference/AGENTS.md')]);
    assert.deepEqual(readNode(f.root)?.links.children, [path.join(child, 'AGENTS.md')]);
  } finally { f.cleanup(); }
});

test('heading-only entries and local encoded/angle links work; examples and remote links do not create children', () => {
  const f = fixture();
  try {
    f.node('', '# Root\n## 下层记忆索引\n- [One](<a space/AGENTS.md>)\n- [Two](encoded%20dir/AGENTS.md "title")\n- [Three](group(x)/AGENTS.md)\n- [Remote](https://example.com/AGENTS.md)\n```md\n- [Example](example/AGENTS.md)\n```\n## Other\n[Reference](other/AGENTS.md)');
    const a = f.node('a space');
    const b = f.node('encoded dir');
    const c = f.node('group(x)');
    f.node('example');
    f.node('other');
    assert.deepEqual(readNodeTree(f.root).map(node => node.location.directory), [f.root, a, b, c]);
  } finally { f.cleanup(); }
});

test('reference traversal respects explicit boundaries, symlinks, missing entries and caller repository policy', () => {
  const f = fixture();
  try {
    const root = f.node('root', children('- [Outside](../outside/AGENTS.md)\n- [Linked](linked/AGENTS.md)\n- [Repo](vendor/AGENTS.md)\n- [Missing](missing/AGENTS.md)'));
    const outside = f.node('outside');
    const vendor = f.node('root/vendor');
    mkdirSync(path.join(vendor, '.git'));
    symlinkSync(outside, path.join(root, 'linked'));
    assert.deepEqual(readNodeTree(root, { canVisit: dir => !existsSync(path.join(dir, '.git')) }).map(node => node.location.directory), [root]);
    assert.deepEqual(readNodeTree(root, { boundary: f.root, canVisit: dir => !existsSync(path.join(dir, '.git')) }).map(node => node.location.directory), [root, outside]);
  } finally { f.cleanup(); }
});

test('physical discovery traverses containers, without following symlinks or caller-excluded repositories', () => {
  const f = fixture();
  try {
    f.node('');
    const child = f.node('.harness/method');
    f.node('vendor/hidden');
    mkdirSync(path.join(f.root, 'vendor/.git'));
    symlinkSync(child, path.join(f.root, 'alias'));
    const nodes = discoverNodes(f.root, { enterDirectory: dir => !existsSync(path.join(dir, '.git')) });
    assert.deepEqual(nodes.map(node => node.location.directory), [f.root, child]);
    assert.deepEqual(discoverNodes(f.root, { acceptNode: node => node.location.directory === child }).map(node => node.location.directory), [child]);
  } finally { f.cleanup(); }
});

test('AGENTS symlinks are not read as owned node entries', () => {
  const f = fixture();
  try {
    const child = f.node('child');
    symlinkSync(path.join(child, 'AGENTS.md'), path.join(f.root, 'AGENTS.md'));
    assert.equal(readNode(f.root), undefined);
  } finally { f.cleanup(); }
});

test('indented code, escaped syntax and multiline code spans never become ownership links', () => {
  const f = fixture();
  try {
    f.node('', '## 下层记忆索引\n\n    [Indented](fake/AGENTS.md)\n\n\\[Escaped](fake/AGENTS.md)\n\n`example\n[Multiline](fake/AGENTS.md)\n`\n\n[Real](real/AGENTS.md)');
    f.node('fake');
    const real = f.node('real');
    assert.deepEqual(readNodeTree(f.root).map(node => node.location.directory), [f.root, real]);
  } finally { f.cleanup(); }
});

test('comment delimiters in code and fences in comments do not hide following real children', () => {
  const f = fixture();
  try {
    f.node('', 'Use `<!--` in examples.\n\n<!--\n```\n[Hidden](fake/AGENTS.md)\n-->\n\n## 下层记忆索引\n\n[Real](real/AGENTS.md)');
    f.node('fake');
    const real = f.node('real');
    assert.deepEqual(readNodeTree(f.root).map(node => node.location.directory), [f.root, real]);
  } finally { f.cleanup(); }
});

test('logical links cannot jump through an excluded repository to a deeper node', () => {
  const f = fixture();
  try {
    f.node('', children('[Deep](vendor/src/AGENTS.md)'));
    f.node('vendor/src');
    mkdirSync(path.join(f.root, 'vendor/.git'));
    assert.deepEqual(readNodeTree(f.root, { canVisit: dir => !existsSync(path.join(dir, '.git')) }).map(node => node.location.directory), [f.root]);
  } finally { f.cleanup(); }
});

for (const definitions of [
  '[child]: first/AGENTS.md\n[child]: second/AGENTS.md',
  '> [child]: first/AGENTS.md',
]) {
  test(`reference definitions preserve CommonMark ownership: ${definitions.split('\n')[0]}`, () => {
    const f = fixture();
    try {
      f.node('', `## 下层记忆索引\n\n[Child][child]\n\n${definitions}\n`);
      const first = f.node('first');
      f.node('second');
      assert.deepEqual(readNodeTree(f.root).map(node => node.location.directory), [f.root, first]);
    } finally { f.cleanup(); }
  });
}

test('CLI source utilities work through tsx without generated output or a workspace package', () => {
  const f = fixture();
  try {
    const cliRoot = fileURLToPath(new URL('../../../', import.meta.url));
    cpSync(path.join(cliRoot, 'src/utils/node-tree'), path.join(f.root, 'src/utils/node-tree'), { recursive: true });
    writeFileSync(path.join(f.root, 'package.json'), JSON.stringify({ type: 'module' }));
    symlinkSync(path.join(cliRoot, 'node_modules'), path.join(f.root, 'node_modules'));
    const output = execFileSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', "import {parseNode} from './src/utils/node-tree/index.ts'; console.log(parseNode('---\\ndescription: scope\\n---\\n# Node').metadata.description)"], { cwd: f.root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    assert.equal(output.trim(), 'scope');
  } finally { f.cleanup(); }
});
