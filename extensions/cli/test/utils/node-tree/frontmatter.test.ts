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

test('unchanged and body-only edits preserve BOM, CRLF and YAML bytes', () => {
  const original = '\uFEFF' + source.replace(/\n/g, '\r\n');
  const doc = codec.parseDocument(original);
  assert.equal(codec.serializeDocument(doc, original), original);
  doc.body += '\r\nNew prose.';
  assert.equal(codec.serializeDocument(doc, original), original + '\r\nNew prose.');
});

test('metadata edits preserve nested unknown data, comments and Markdown bytes', () => {
  const doc = codec.parseDocument(source);
  doc.metadata!.description = 'Scope description';
  const result = codec.serializeDocument(doc, source);
  assert.match(result, /description: "Scope description" # keep/);
  assert.match(result, /tags: \[one, two\]/);
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
  assert.equal(codec.serializeDocument(doc, original), original);
});

test('invalid or unrepresentable YAML fails without silently treating it as Markdown', () => {
  for (const header of ['name: [', 'name: a\nname: b', '- sequence', '42', 'value: !unknown x', 'value: .inf', '? [a, b]\n: complex']) {
    assert.throws(() => codec.parseDocument(`---\n${header}\n---\nbody`));
  }
  assert.throws(() => codec.parseDocument('---\nname: never closed'));
  assert.throws(() => codec.parseDocument('---\nname: a\n---suffix\nbody'));
  assert.throws(() => codec.serializeDocument({ metadata: { invalid: NaN }, body }));
});

test('cyclic aliases are rejected and alias edits cannot silently change other fields', () => {
  assert.throws(() => codec.parseDocument('---\nvalue: &cycle [*cycle]\n---\n'));
  const original = '---\none: &item {description: old}\ntwo: *item\n---\nbody';
  const doc = codec.parseDocument(original);
  assert.equal(codec.serializeDocument(doc, original), original);
  doc.metadata!.one = { description: 'new' };
  assert.throws(() => codec.serializeDocument(doc, original), /lossless|represent/);
});

test('body can be added after a closing delimiter at EOF', () => {
  const original = '---\ndescription: empty body\n---';
  const doc = codec.parseDocument(original);
  assert.equal(codec.serializeDocument(doc, original), original);
  doc.body = '# New body';
  assert.deepEqual(codec.parseDocument(codec.serializeDocument(doc, original)), doc);
});

test('empty and comment-only headers can receive metadata', () => {
  for (const original of ['---\n---\nBody', '---\n# Remember this\n---\nBody']) {
    const doc = codec.parseDocument(original);
    doc.metadata!.description = 'value';
    const output = codec.serializeDocument(doc, original);
    assert.deepEqual(codec.parseDocument(output), doc);
    if (original.includes('# Remember')) assert.match(output, /# Remember this/);
  }
});

test('metadata removal and scalar type changes keep the requested values', () => {
  const original = '---\nmetadata:\n  old: remove\n  count: 1 # counter\n  enabled: true\n---\nbody';
  const doc = codec.parseDocument(original);
  doc.metadata!.metadata = { count: '1', enabled: false, next: [null, { description: 'true' }] };
  const result = codec.serializeDocument(doc, original);
  assert.deepEqual(codec.parseDocument(result), doc);
  assert.match(result, /# counter/);
  assert.doesNotMatch(result, /old: remove/);
});

test('keep-chomp multiline values retain all trailing newlines on unrelated edits', () => {
  const original = '---\nname: before\nvalue: |+\n  text\n\n---\nbody';
  const doc = codec.parseDocument(original);
  assert.equal(doc.metadata!.value, 'text\n\n');
  doc.metadata!.name = 'after';
  assert.deepEqual(codec.parseDocument(codec.serializeDocument(doc, original)), doc);
});

test('YAML integers outside the safe JSON number range are rejected before rounding', () => {
  for (const value of ['9007199254740993', '-9007199254740993', '0x20000000000001']) {
    assert.throws(() => codec.parseDocument(`---\nvalue: ${value}\n---\nbody`), /integer|represent|safe/);
  }
  assert.equal(codec.parseDocument('---\nvalue: 9007199254740991\n---\n').metadata!.value, Number.MAX_SAFE_INTEGER);
});

test('array insertions, reorderings and nested edits retain existing comments and styles', () => {
  const original = '---\ntags:\n  - one # keep one\n  - "two" # keep two\nitems:\n  - name: before # explanation\n---\nbody';
  const doc = codec.parseDocument(original);
  doc.metadata!.tags = ['new', 'two', 'one'];
  doc.metadata!.items = [{ name: 'after' }];
  const output = codec.serializeDocument(doc, original);
  assert.match(output, /one # keep one/);
  assert.match(output, /"two" # keep two/);
  assert.match(output, /name: after # explanation/);
  assert.deepEqual(codec.parseDocument(output), doc);
});

test('metadata type changes preserve comments attached to the replaced node', () => {
  const original = '---\n# Field explanation\nextension: old # Preserve this note\n---\nbody';
  const doc = codec.parseDocument(original);
  doc.metadata!.extension = { enabled: true };
  const output = codec.serializeDocument(doc, original);
  assert.match(output, /# Field explanation/);
  assert.match(output, /# Preserve this note/);
  assert.deepEqual(codec.parseDocument(output), doc);
  doc.metadata!.extension = ['changed type again'];
  const second = codec.serializeDocument(doc, output);
  assert.match(second, /# Field explanation/);
  assert.match(second, /# Preserve this note/);
  assert.deepEqual(codec.parseDocument(second), doc);
});

test('document tree context does not alter persisted YAML or Markdown', () => {
  const doc: MarkdownDocument = {
    ...codec.parseDocument(source),
    id: 'memory-scope',
    parent: { target: 'root', label: 'Root scope' },
    children: [{ target: 'nested-scope' }, { target: '../shared/AGENTS.md', label: 'Shared' }],
  };
  assert.equal(codec.serializeDocument(doc, source), source);
  doc.body += '\nNew note.\n';
  const result = codec.serializeDocument(doc, source);
  assert.equal(result, source + '\nNew note.\n');
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
