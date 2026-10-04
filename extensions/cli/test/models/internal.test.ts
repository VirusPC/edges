import assert from 'node:assert/strict';
import test from 'node:test';
import { InternalNode } from '../../src/models/index.js';

const source = `# Context

See [plain](plain.md).

<!-- project-memory-important:start -->
## 本层重要约束

- Keep the rule.
<!-- project-memory-important:end -->

<!-- project-memory-local:start -->
## 本层记忆

Authored **introduction**, kept verbatim.

- [One](one.md) — first description
<!-- project-memory-local:end -->

<!-- project-memory-children:start -->
## 下层记忆索引

- [Nested](nested/AGENTS.md) — nested scope
<!-- project-memory-children:end -->

Footer stays.
`;

test('internal nodes derive only indexed ownership and preserve authored source', () => {
  const node = new InternalNode('/scope/AGENTS.md').parse(source);
  assert.deepEqual(node.content.constraints, ['Keep the rule.']);
  assert.deepEqual(node.children, [
    { target: 'one.md', label: 'One', description: 'first description', kind: 'local' },
    { target: 'nested/AGENTS.md', label: 'Nested', description: 'nested scope', kind: 'descendant' },
  ]);
  assert.deepEqual(node.content.localMemory, [{ target: 'one.md', label: 'One', description: 'first description' }]);
  assert.equal(node.serialize(), source);
  (node.content as any).localMemory[0].target = 'bad';
  (node.children as any)[0].target = 'bad';
  assert.equal(node.children[0].target, 'one.md');
});

test('index edits replace optional fields, move kind, and retain non-index prose', () => {
  const node = new InternalNode('/scope/AGENTS.md').parse(source);
  node.updateChild({ target: 'one.md', kind: 'descendant' });
  assert.deepEqual(node.children, [
    { target: 'nested/AGENTS.md', label: 'Nested', description: 'nested scope', kind: 'descendant' },
    { target: 'one.md', kind: 'descendant' },
  ]);
  node.addChild({ target: 'dir/a space (#1).md', label: '[x] *literal*', description: 'Use [a] & <b>', kind: 'local' });
  node.setConstraints(['New *literal* rule']);
  const rendered = node.serialize();
  const read = new InternalNode(node.path).parse(rendered);
  assert.deepEqual(read.children, [
    { target: 'dir/a space (#1).md', label: '[x] *literal*', description: 'Use [a] & <b>', kind: 'local' },
    { target: 'nested/AGENTS.md', label: 'Nested', description: 'nested scope', kind: 'descendant' },
    { target: 'one.md', label: 'one.md', kind: 'descendant' },
  ]);
  assert.deepEqual(read.content.constraints, ['New *literal* rule']);
  assert.match(rendered, /Authored \*\*introduction\*\*, kept verbatim\./);
  assert.match(rendered, /See \[plain\]\(plain.md\)\./);
  assert.match(rendered, /## 本层重要约束/);
  assert.match(rendered, /Footer stays\./);
  node.removeChild({ target: 'one.md' });
  assert.equal(new InternalNode(node.path).parse(node.serialize()).children.length, 2);
});

test('index mutation validates kind and target before changing document', () => {
  const node = new InternalNode('/scope/AGENTS.md').parse(source);
  for (const action of [
    () => node.addChild({ target: 'new.md' }),
    () => node.addChild({ target: 'one.md', kind: 'local' }),
    () => node.updateChild({ target: 'missing.md', kind: 'local' }),
    () => node.updateChild({ target: 'one.md', kind: 'other' as any }),
    () => node.addChild({ target: 'broken\npath', kind: 'local' }),
  ]) { assert.throws(action); assert.equal(node.serialize(), source); }
});

test('parse and body replacement discard old sections and indexes', () => {
  const node = new InternalNode('/scope/AGENTS.md').parse(source);
  node.body = '## 本层记忆\n\n- [Second](second.md)\n';
  assert.deepEqual(node.children, [{ target: 'second.md', label: 'Second', kind: 'local' }]);
  assert.deepEqual(node.content.constraints, []);
  node.parse('A standalone entry.\n');
  assert.deepEqual(node.children, []);
  assert.equal(node.body, 'A standalone entry.\n');
  node.addChild({ target: 'fresh.md', kind: 'local' });
  assert.equal(new InternalNode(node.path).parse(node.body).children[0].target, 'fresh.md');
});

test('existing type index entries behave as local without adding section headings', () => {
  const original = `<!-- project-memory-type:start -->
name: project
module: memory
<!-- project-memory-type:end -->

# PROJECT

> Authored purpose.

<!-- project-memory-entries:start -->
- [First](first.md) — keep
<!-- project-memory-entries:end -->
`;
  const node = new InternalNode('/scope/types/AGENTS.md').parse(original);
  assert.deepEqual(node.children, [{ target: 'first.md', label: 'First', description: 'keep', kind: 'local' }]);
  assert.equal(node.serialize(), original);
  node.updateChild({ target: 'first.md', label: 'Revised', kind: 'local' });
  node.addChild({ target: 'second.md', label: 'Second', kind: 'local' });
  const rendered = node.serialize();
  assert.match(rendered, /project-memory-entries:start/);
  assert.match(rendered, /name: project\nmodule: memory/);
  assert.match(rendered, /> Authored purpose\./);
  assert.doesNotMatch(rendered, /## 本层记忆|project-memory-local|project-memory-children/);
  assert.deepEqual(new InternalNode(node.path).parse(rendered).children.map(ref => ref.target), ['first.md', 'second.md']);
});

test('multiple actual indexed links are exposed while ordinary prose remains unchanged', () => {
  const original = '## 本层记忆\n\n- [One](one.md) and [Two](two.md) — shared\n\nAn introduction.\n';
  const node = new InternalNode('/scope/AGENTS.md').parse(original);
  assert.deepEqual(node.children.map(ref => ref.target), ['one.md', 'two.md']);
  assert.equal(node.serialize(), original);
});

test('re-added children serialize in the same order as the current view', () => {
  const node = new InternalNode('/scope/AGENTS.md').parse('## 本层记忆\n\n- [A](a.md)\n- [B](b.md)\n');
  node.removeChild({ target: 'a.md' });
  node.addChild({ target: 'a.md', label: 'A', kind: 'local' });
  assert.deepEqual(node.children.map(ref => ref.target), ['b.md', 'a.md']);
  assert.deepEqual(new InternalNode(node.path).parse(node.serialize()).children.map(ref => ref.target), ['b.md', 'a.md']);
});

test('CRLF type indexes preserve their markers and local ownership', () => {
  const original = '# Type\r\n\r\n<!-- project-memory-entries:start -->\r\n- [A](a.md)\r\n<!-- project-memory-entries:end -->\r\n';
  const node = new InternalNode('/scope/types/AGENTS.md').parse(original);
  assert.deepEqual(node.children, [{ target: 'a.md', label: 'A', kind: 'local' }]);
  assert.equal(node.serialize(), original);
  node.updateChild({ target: 'a.md', label: 'B', kind: 'local' });
  assert.match(node.serialize(), /project-memory-entries:start -->\r\n/);
});

test('linked prose within ownership sections stays ordinary and survives index edits', () => {
  for (const [heading, kind] of [['本层记忆', 'local'], ['下层记忆索引', 'descendant']] as const) {
    const original = `## ${heading}\n\nSee [README](README.md) for usage.\n\n- [Task](task.md) — owned\n`;
    const node = new InternalNode('/scope/AGENTS.md').parse(original);
    assert.deepEqual(node.children, [{ target: 'task.md', label: 'Task', description: 'owned', kind }]);
    assert.equal(node.serialize(), original);
    node.updateChild({ target: 'task.md', label: 'Changed', description: 'owned', kind });
    const rendered = node.serialize();
    assert.match(rendered, /^See \[README\]\(README\.md\) for usage\.$/m);
    assert.match(rendered, /^- \[Changed\]\(<task\.md>\) — owned$/m);
    assert.deepEqual(new InternalNode(node.path).parse(rendered).children, [{ target: 'task.md', label: 'Changed', description: 'owned', kind }]);
  }
});

test('ambiguous multi-link index edits reject before changing content or Markdown', () => {
  const original = '## 本层记忆\n\n- [One](one.md) and [Two](two.md) — shared\n';
  const node = new InternalNode('/scope/AGENTS.md').parse(original);
  const before = node.content;
  for (const edit of [
    () => node.updateChild({ target: 'one.md', label: 'Changed', kind: 'local' }),
    () => node.updateChild({ target: 'two.md', label: 'Two', kind: 'descendant' }),
    () => node.removeChild({ target: 'one.md' }),
  ]) {
    assert.throws(edit, /multi-link/i);
    assert.deepEqual(node.content, before);
    assert.equal(node.body, original);
    assert.equal(node.serialize(), original);
  }
  node.addChild({ target: 'three.md', label: 'Three', kind: 'local' });
  const rendered = node.serialize();
  assert.match(rendered, /^- \[One\]\(one\.md\) and \[Two\]\(two\.md\) — shared$/m);
  assert.match(rendered, /^- \[Three\]\(<three\.md>\)$/m);
});
