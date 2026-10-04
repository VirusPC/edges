import test from 'node:test';
import assert from 'node:assert/strict';
import * as codecs from '../../../src/utils/node-tree/codec/index.js';
import type { DocumentCodec, MarkdownDocument } from '../../../src/utils/node-tree/document-model.js';
import * as tasks from '../../../src/tasks/utils/frontmatter.js';

const source = '---\ndescription: "Scope" # keep\nmetadata:\n  edges-type: project\n---\n## 本层记忆\n\n- [Local](memory/AGENTS.md)\n';

test('base and memory codecs tag documents without changing YAML classification', () => {
  function check<TType extends string>(codec: DocumentCodec<MarkdownDocument<TType>, TType>) {
    assert.ok(codec, 'a document codec is available');
    const doc = codec.parse(source);
    assert.equal(doc.type, codec.type);
    assert.deepEqual(doc.metadata!.metadata, { 'edges-type': 'project' });
    assert.equal(codec.serialize(doc, source), source);
  }
  check(codecs.baseDocumentCodec);
  check(codecs.memoryDocumentCodec);
});

test('agents codec uses the existing section model and preserves original source', () => {
  assert.ok(codecs.agentsDocumentCodec);
  const model = codecs.agentsDocumentCodec.parse(source);
  assert.equal(codecs.agentsDocumentCodec.type, 'agents');
  assert.equal(model.memory.length, 1);
  model.memory.push({ content: [{ kind: 'text', value: 'Extra rule' }] });
  assert.deepEqual(codecs.agentsDocumentCodec.parse(codecs.agentsDocumentCodec.serialize(model, source)), model);
});

test('typed Markdown codec rejects documents belonging to another codec', () => {
  assert.ok(codecs.memoryDocumentCodec);
  const doc = { type: 'task', body: 'body' } as unknown as MarkdownDocument<'memory'>;
  assert.throws(() => codecs.memoryDocumentCodec.serialize(doc), /type|codec/i);
});

test('Task codec validates Task metadata while reusing loss-preserving Markdown handling', () => {
  assert.ok(tasks.taskDocumentCodec);
  const source = '---\nname: example\nmetadata:\n  edges-type: task\n  edges-title: original # keep\n---\nBody';
  const doc = tasks.taskDocumentCodec.parse(source);
  assert.equal(doc.type, 'task');
  assert.equal(tasks.taskDocumentCodec.serialize(doc, source), source);
  assert.throws(() => tasks.taskDocumentCodec.parse('---\nmetadata: [invalid]\n---\nBody'), /mapping/);
  assert.equal(tasks.parseTaskDoc(source).name, 'example');
});
