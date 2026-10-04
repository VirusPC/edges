import test from 'node:test';
import assert from 'node:assert/strict';
import * as codec from '../../../src/utils/node-tree/codec/index.js';
import type { MarkdownDocument } from '../../../src/utils/node-tree/document-model.js';

const body = '## 本层记忆\n\n- [Memory](memory/AGENTS.md)\n';
const source = '---\ndescription: "[Not a node](fake/AGENTS.md)" # keep\nextra:\n  tags: [one, two]\n---\n' + body;

test('YAML links are metadata, not node references', () => {
  const node = codec.parseNode(source);
  assert.deepEqual(node.references, []);
  assert.deepEqual(node.metadata, { description: '[Not a node](fake/AGENTS.md)', extra: { tags: ['one', 'two'] } });
  assert.equal(node.memory.length, 1);
});

test('documents have optional metadata and an opaque Markdown body', () => {
  assert.equal(typeof codec.parseDocument, 'function');
  assert.deepEqual(codec.parseDocument(body), { body });
  assert.deepEqual(codec.parseDocument('---\n---\n' + body), { metadata: {}, body });
  assert.equal(codec.parseDocument(source).body, body);
});

test('body-only edits preserve BOM and Markdown bytes', () => {
  const original = '\uFEFF' + source.replace(/\n/g, '\r\n');
  const doc = codec.parseDocument(original);
  assert.deepEqual(codec.parseDocument(codec.serializeDocument(doc, original)), doc);
  doc.body += '\r\nNew prose.';
  assert.deepEqual(codec.parseDocument(codec.serializeDocument(doc, original)), doc);
  assert.ok(codec.serializeDocument(doc, original).startsWith('\uFEFF'));
});

test('metadata edits preserve nested unknown data and Markdown bytes', () => {
  const doc = codec.parseDocument(source);
  doc.metadata!.description = 'Scope description';
  const result = codec.serializeDocument(doc, source);
  assert.deepEqual(codec.parseDocument(result), doc);
  assert.equal(codec.parseDocument(result).body, body);
});

test('headers can be added and removed, including empty headers', () => {
  const added = codec.serializeDocument({ metadata: { description: 'A scope' }, body }, body);
  assert.deepEqual(codec.parseDocument(added), { metadata: { description: 'A scope' }, body });
  assert.equal(codec.serializeDocument({ body }, added), body);
  assert.deepEqual(codec.parseDocument(codec.serializeDocument({ metadata: {}, body })), { metadata: {}, body });
});

test('node metadata and body can be edited independently', () => {
  const node = codec.parseNode(source);
  node.metadata!.description = 'New description';
  let next = codec.serializeNode(node, source);
  assert.equal(codec.parseDocument(next).body, body);
  const header = next.slice(0, next.length - body.length);
  node.memory.push({ content: [{ kind: 'text', value: 'Extra memory' }] });
  next = codec.serializeNode(node, next);
  assert.ok(next.startsWith(header));
  assert.deepEqual(codec.parseNode(next), node);
  assert.deepEqual(codec.parseNode(codec.serializeNode(node)), node);
});

test('memory documents support typed fields, multiline YAML and literal Markdown examples', () => {
  const original = '---\nname: memory_example\ndescription: >-\n  first line\n  second line\nmetadata:\n  enabled: true\n  count: 2\n  missing: null\n  date: 2026-10-04\n...\n\n```yaml\n---\nnot: a header\n```\n';
  const doc = codec.parseDocument(original);
  assert.equal(doc.metadata!.description, 'first line second line');
  assert.deepEqual(doc.metadata!.metadata, { enabled: true, count: 2, missing: null, date: '2026-10-04' });
  assert.deepEqual(codec.parseDocument(codec.serializeDocument(doc, original)), doc);
});

test('invalid or unrepresentable YAML fails without silently treating it as Markdown', () => {
  for (const header of ['name: [', 'name: a\nname: b', '- sequence', '42', 'value: !unknown x', 'value: .inf', 'null', '~', '? [a, b]\n: complex', '123: x', 'false: x', 'null: x']) {
    assert.throws(() => codec.parseDocument(`---\n${header}\n---\nbody`));
  }
  assert.throws(() => codec.parseDocument('---\nname: never closed'));
  assert.throws(() => codec.parseDocument('---\nname: a\n---suffix\nbody'));
  assert.throws(() => codec.serializeDocument({ metadata: { invalid: NaN }, body }));
});

test('cyclic aliases are rejected and aliases can be edited as independent values', () => {
  assert.throws(() => codec.parseDocument('---\nvalue: &cycle [*cycle]\n---\n'));
  const original = '---\none: &item {description: old}\ntwo: *item\n---\nbody';
  const doc = codec.parseDocument(original);
  assert.deepEqual(codec.parseDocument(codec.serializeDocument(doc, original)), doc);
  doc.metadata!.one = { description: 'new' };
  const result = codec.parseDocument(codec.serializeDocument(doc, original));
  assert.deepEqual(result, doc);
  assert.deepEqual(result.metadata!.two, { description: 'old' });
});

test('body can be added after a closing delimiter at EOF', () => {
  const original = '---\ndescription: empty body\n---';
  const doc = codec.parseDocument(original);
  assert.deepEqual(codec.parseDocument(codec.serializeDocument(doc, original)), doc);
  doc.body = '# New body';
  assert.deepEqual(codec.parseDocument(codec.serializeDocument(doc, original)), doc);
});

test('empty and comment-only headers can receive metadata', () => {
  for (const original of ['---\n---\nBody', '---\n# Remember this\n---\nBody']) {
    const doc = codec.parseDocument(original);
    doc.metadata!.description = 'value';
    const output = codec.serializeDocument(doc, original);
    assert.deepEqual(codec.parseDocument(output), doc);
  }
});

test('metadata removal and scalar type changes keep the requested values', () => {
  const original = '---\nmetadata:\n  old: remove\n  count: 1 # counter\n  enabled: true\n---\nbody';
  const doc = codec.parseDocument(original);
  doc.metadata!.metadata = { count: '1', enabled: false, next: [null, { description: 'true' }] };
  const result = codec.serializeDocument(doc, original);
  assert.deepEqual(codec.parseDocument(result), doc);
  assert.doesNotMatch(result, /old: remove/);
});

test('keep-chomp multiline values retain all trailing newlines on unrelated edits', () => {
  const original = '---\nname: before\nvalue: |+\n  text\n\n---\nbody';
  const doc = codec.parseDocument(original);
  assert.equal(doc.metadata!.value, 'text\n\n');
  doc.metadata!.name = 'after';
  assert.deepEqual(codec.parseDocument(codec.serializeDocument(doc, original)), doc);
});

test('YAML integers outside the safe JSON number range are rejected', () => {
  for (const value of ['9007199254740993', '-9007199254740993', '0x20000000000001']) {
    assert.throws(() => codec.parseDocument(`---\nvalue: ${value}\n---\nbody`), /integer|represent|safe/);
  }
  assert.equal(codec.parseDocument('---\nvalue: 9007199254740991\n---\n').metadata!.value, Number.MAX_SAFE_INTEGER);
});

test('array insertions, reorderings and nested edits retain requested values', () => {
  const original = '---\ntags:\n  - one # keep one\n  - "two" # keep two\nitems:\n  - name: before # explanation\n---\nbody';
  const doc = codec.parseDocument(original);
  doc.metadata!.tags = ['new', 'two', 'one'];
  doc.metadata!.items = [{ name: 'after' }];
  const output = codec.serializeDocument(doc, original);
  assert.deepEqual(codec.parseDocument(output), doc);
});

test('metadata type changes retain requested values', () => {
  const original = '---\n# Field explanation\nextension: old # Preserve this note\n---\nbody';
  const doc = codec.parseDocument(original);
  doc.metadata!.extension = { enabled: true };
  const output = codec.serializeDocument(doc, original);
  assert.deepEqual(codec.parseDocument(output), doc);
  doc.metadata!.extension = ['changed type again'];
  const second = codec.serializeDocument(doc, output);
  assert.deepEqual(codec.parseDocument(second), doc);
});

test('document tree context does not alter persisted YAML or Markdown', () => {
  const doc: MarkdownDocument = {
    ...codec.parseDocument(source),
    id: 'memory-scope',
    parent: { target: 'root', label: 'Root scope' },
    children: [{ target: 'nested-scope' }, { target: '../shared/AGENTS.md', label: 'Shared' }],
  };
  assert.deepEqual(codec.parseDocument(codec.serializeDocument(doc, source)), codec.parseDocument(source));
  doc.body += '\nNew note.\n';
  const result = codec.serializeDocument(doc, source);
  assert.deepEqual(codec.parseDocument(result), { metadata: doc.metadata, body: doc.body });
  assert.deepEqual(doc.children, [{ target: 'nested-scope' }, { target: '../shared/AGENTS.md', label: 'Shared' }]);
});

test('tree context is optional and independent from similarly named YAML keys', () => {
  const doc: MarkdownDocument = {
    metadata: { id: 'yaml-id', parent: 'yaml-parent', children: ['yaml-child'] },
    body: '# Note\n',
    id: 'loaded-id', parent: { target: 'loaded-parent' }, children: [],
  };
  const result = codec.serializeDocument(doc);
  assert.deepEqual(codec.parseDocument(result), {
    metadata: { id: 'yaml-id', parent: 'yaml-parent', children: ['yaml-child'] }, body: '# Note\n',
  });
  assert.equal(codec.serializeDocument({ body: '# Plain\n' }), '# Plain\n');
});


test('YAML keys beginning with delimiter characters are data', () => {
  const original = '---\n---foo: bar\nname: test\n---\nBody';
  const doc = codec.parseDocument(original);
  assert.deepEqual(doc, { metadata: { '---foo': 'bar', name: 'test' }, body: 'Body' });
  assert.deepEqual(codec.parseDocument(codec.serializeDocument(doc, original)), doc);
});


test('alias expansion is bounded before it exhausts memory', () => {
  const fields = ['v0: &v0 [value]'];
  for (let i = 1; i <= 20; i++) fields.push(`v${i}: &v${i} [*v${i - 1}, *v${i - 1}]`);
  assert.throws(() => codec.parseDocument(`---\n${fields.join('\n')}\n---\nBody`), /limit|budget|complex|alias/i);
});
