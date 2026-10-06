import test from "node:test";
import assert from "node:assert/strict";
import { parseTaskDoc, setMetadataField, setTopLevelField, replaceBody, renderNewTaskDoc, taskDocumentCodec } from "../../../src/domain/models/tasks/frontmatter.js";

const SAMPLE = `---
name: cli_refactor_commanderjs
description: CLI 用 Commander.js 重构
metadata:
  edges-type: task
  edges-title: CLI 用 Commander.js 重构
  edges-tasks-status: done
  edges-task-pr: "https://github.com/VirusPC/edges/pull/37"
  edges-updated-at: "2026-09-11T20:08:00+08:00"
---

CLI 用 Commander.js（commander）重构。

**Why:**
reason

**How to apply:**
- do the thing
`;

test("parseTaskDoc reads name, description, nested edges-* metadata, body", () => {
  const doc = parseTaskDoc(SAMPLE);
  assert.equal(doc.name, "cli_refactor_commanderjs");
  assert.equal(doc.metadata["edges-tasks-status"], "done");
  assert.equal(doc.metadata["edges-title"], "CLI 用 Commander.js 重构");
  assert.match(doc.body, /Commander\.js/);
});

test("setMetadataField changes only that key and keeps neighbor order", () => {
  const next = setMetadataField(SAMPLE, "edges-tasks-status", "cancelled");
  assert.match(next, /edges-type: task\n  edges-title:/);
  assert.match(next, /edges-tasks-status: cancelled/);
  assert.match(next, /edges-task-pr:/);
  assert.equal(parseTaskDoc(next).metadata["edges-tasks-status"], "cancelled");
});

test("renderNewTaskDoc writes ADR 0002 shape and omits empty assignee", () => {
  const md = renderNewTaskDoc({
    name: "edges_tasks_cli",
    description: "edges tasks CLI",
    title: "edges tasks CLI",
    status: "backlog",
    updatedAt: "2026-09-13T03:00:00+00:00",
    body: "edges tasks CLI\n\n**Why:**\n\n\n**How to apply:**\n",
  });
  assert.match(md, /^---\nname: edges_tasks_cli\n/);
  assert.match(md, /edges-type: task/);
  assert.match(md, /edges-tasks-status: backlog/);
  assert.doesNotMatch(md, /edges-task-assignee/);
});

test("renderNewTaskDoc omits edges-task-priority when none or omitted", () => {
  const omitted = renderNewTaskDoc({
    name: "edges_tasks_cli",
    description: "edges tasks CLI",
    title: "edges tasks CLI",
    status: "backlog",
    updatedAt: "2026-09-13T03:00:00+00:00",
    body: "body\n",
  });
  assert.doesNotMatch(omitted, /edges-task-priority/);

  const explicitNone = renderNewTaskDoc({
    name: "edges_tasks_cli",
    description: "edges tasks CLI",
    title: "edges tasks CLI",
    status: "backlog",
    priority: "none",
    updatedAt: "2026-09-13T03:00:00+00:00",
    body: "body\n",
  });
  assert.doesNotMatch(explicitNone, /edges-task-priority/);
});

test("renderNewTaskDoc writes edges-task-priority after status when high", () => {
  const md = renderNewTaskDoc({
    name: "edges_tasks_cli",
    description: "edges tasks CLI",
    title: "edges tasks CLI",
    status: "todo",
    priority: "high",
    updatedAt: "2026-09-13T03:00:00+00:00",
    body: "body\n",
  });
  assert.match(md, /edges-tasks-status: todo\n  edges-task-priority: high\n/);
  assert.equal(parseTaskDoc(md).metadata["edges-task-priority"], "high");
});

test("renderNewTaskDoc omits edges-task-project when default or omitted", () => {
  const omitted = renderNewTaskDoc({
    name: "edges_tasks_cli",
    description: "edges tasks CLI",
    title: "edges tasks CLI",
    status: "backlog",
    updatedAt: "2026-09-13T03:00:00+00:00",
    body: "body\n",
  });
  assert.doesNotMatch(omitted, /edges-task-project/);

  const explicitDefault = renderNewTaskDoc({
    name: "edges_tasks_cli",
    description: "edges tasks CLI",
    title: "edges tasks CLI",
    status: "backlog",
    project: "default",
    updatedAt: "2026-09-13T03:00:00+00:00",
    body: "body\n",
  });
  assert.doesNotMatch(explicitDefault, /edges-task-project/);
});

test("renderNewTaskDoc writes edges-task-project after status when not default", () => {
  const md = renderNewTaskDoc({
    name: "edges_tasks_cli",
    description: "edges tasks CLI",
    title: "edges tasks CLI",
    status: "todo",
    project: "cli",
    priority: "high",
    updatedAt: "2026-09-13T03:00:00+00:00",
    body: "body\n",
  });
  assert.match(md, /edges-tasks-status: todo\n  edges-task-project: cli\n  edges-task-priority: high\n/);
  assert.equal(parseTaskDoc(md).metadata["edges-task-project"], "cli");
});

test("setMetadataField can set edges-task-priority to none", () => {
  const withHigh = renderNewTaskDoc({
    name: "n",
    description: "d",
    title: "t",
    status: "todo",
    priority: "high",
    updatedAt: "2026-09-13T03:00:00+00:00",
    body: "body\n",
  });
  const next = setMetadataField(withHigh, "edges-task-priority", "none");
  assert.equal(parseTaskDoc(next).metadata["edges-task-priority"], "none");
  assert.match(next, /edges-tasks-status: todo/);
});

test("Task YAML supports multiline and single-quoted fields", () => {
  const doc = parseTaskDoc("---\nname: 'my task'\ndescription: >-\n  first line\n  second line\nmetadata:\n  edges-title: 'A: title'\n---\nbody\n");
  assert.equal(doc.name, "my task");
  assert.equal(doc.description, "first line second line");
  assert.equal(doc.metadata["edges-title"], "A: title");
});

test("Task metadata edits retain unknown nested fields", () => {
  const source = "---\nname: test\nmetadata:\n  edges-tasks-status: todo # explanation\n  extension: {nested: [one, two]}\n---\nBody with a trailing newline\n";
  const result = setMetadataField(source, "edges-tasks-status", "done");
  assert.equal(parseTaskDoc(result).metadata["edges-tasks-status"], "done");
  assert.deepEqual(taskDocumentCodec.parse(result).metadata!.metadata, { "edges-tasks-status": "done", extension: { nested: ["one", "two"] } });
  assert.equal(parseTaskDoc(result).body, "Body with a trailing newline\n");
});

test("new Task titles and descriptions roundtrip YAML-significant strings", () => {
  const doc = parseTaskDoc(renderNewTaskDoc({ name: 'null', description: 'A: value # not a comment', title: '[title]', status: 'todo', updatedAt: '2026-10-04', body: 'body' }));
  assert.equal(doc.name, 'null');
  assert.equal(doc.description, 'A: value # not a comment');
  assert.equal(doc.metadata['edges-title'], '[title]');
});


test("Task body replacement and top-level edits share the optional document format", () => {
  const source = "---\nname: original\ndescription: before # keep\nmetadata:\n  edges-type: task\n---\n\nOld body\n";
  const updated = setTopLevelField(source, "description", "after: # literal");
  assert.equal(parseTaskDoc(updated).description, "after: # literal");

  const replaced = replaceBody(source, "New body");
  assert.equal(parseTaskDoc(replaced).body, "\nNew body\n");
  assert.deepEqual(taskDocumentCodec.parse(replaced).metadata, taskDocumentCodec.parse(source).metadata);
  assert.equal(setTopLevelField("plain body", "name", "ignored"), "plain body");
  assert.equal(setMetadataField("plain body", "status", "ignored"), "plain body");
  assert.equal(replaceBody("plain body", "New body"), "New body");
});
