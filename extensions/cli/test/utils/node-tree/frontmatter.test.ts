import test from 'node:test';
import assert from 'node:assert/strict';
import * as codec from '../../../src/models/internal/index.js';
import type { MarkdownDocument } from '../../../src/utils/markdown/types.js';

const body = '## 本层记忆\n\n- [Memory](memory/AGENTS.md)\n';
const source = '---\ndescription: "[Not a node](fake/AGENTS.md)" # comment\nextra:\n  tags: [one, two]\n---\n' + body;

test('YAML links remain metadata instead of becoming node references', () => {
  const node = codec.parseNode(source);
  assert.deepEqual(node.references, []);
  assert.deepEqual(node.metadata, { description: '[Not a node](fake/AGENTS.md)', extra: { tags: ['one', 'two'] } });
  assert.equal(node.memory.length, 1);
});

test('documents support optional YAML metadata and an opaque Markdown body', () => {
  assert.deepEqual(codec.parseDocument(body), { body });
  assert.deepEqual(codec.parseDocument('---\n---\n' + body), { metadata: {}, body });
  assert.equal(codec.parseDocument(source).body, body);
  assert.equal(codec.serializeDocument({ body }), body);
});

test('serialization uses default empty-header and final-newline behavior', () => {
  assert.equal(codec.serializeDocument({ metadata: {}, body: 'Body' }), 'Body\n');
  assert.equal(codec.serializeDocument({ metadata: { name: 'example' }, body: 'Body' }), '---\nname: example\n---\nBody\n');
});

test('YAML values use the default engine, including dates and alias references', () => {
  const doc = codec.parseDocument('---\ndate: 2026-10-04\none: &item {name: example}\ntwo: *item\n---\nBody\n');
  assert.deepEqual(doc.metadata!.date, new Date('2026-10-04T00:00:00Z'));
  assert.equal(doc.metadata!.one, doc.metadata!.two);
  assert.deepEqual(codec.parseDocument(codec.serializeDocument(doc)), doc);
});

test('editing a parsed document does not mutate subsequent parses of the same source', () => {
  const doc = codec.parseDocument(source);
  doc.metadata!.description = 'Changed';
  assert.equal(codec.parseDocument(source).metadata!.description, '[Not a node](fake/AGENTS.md)');
});

test('metadata edits retain unknown fields and keep the Markdown body separate', () => {
  const doc = codec.parseDocument(source);
  doc.metadata!.description = 'Updated description';
  const result = codec.parseDocument(codec.serializeDocument(doc));
  assert.deepEqual(result, doc);
  assert.equal(result.body, body);
});

test('node metadata and sections can be edited independently', () => {
  const node = codec.parseNode(source);
  node.metadata!.description = 'New description';
  node.memory.push({ content: [{ kind: 'text', value: 'Extra memory' }] });
  assert.deepEqual(codec.parseNode(codec.serializeNode(node, source)), node);
});

test('document context is independent from similarly named YAML fields', () => {
  const doc: MarkdownDocument = {
    type: 'memory',
    metadata: { id: 'yaml-id', parent: 'yaml-parent', children: ['yaml-child'] },
    body: '# Note\n',
    id: 'loaded-id', parent: { target: 'loaded-parent' }, children: [],
  };
  assert.deepEqual(codec.parseDocument(codec.serializeDocument(doc)), {
    metadata: doc.metadata, body: '# Note\n',
  });
  assert.deepEqual(doc.children, []);
});

test('reading documents never executes a declared JavaScript header', () => {
  const probe = '__edges_frontmatter_probe__';
  const state = globalThis as unknown as Record<string, unknown>;
  try {
    for (const bom of ['', '\uFEFF']) {
      assert.throws(() => codec.parseDocument(`${bom}---javascript\n(globalThis.${probe} = true, {})\n---\nBody\n`), /YAML/);
      assert.equal(state[probe], undefined);
    }
  } finally {
    delete state[probe];
  }
});

test('ordinary Markdown thematic breaks remain body content', () => {
  for (const body of ['----\nBody\n', '-----\nBody\n']) {
    assert.deepEqual(codec.parseDocument(body), { body });
  }
});
