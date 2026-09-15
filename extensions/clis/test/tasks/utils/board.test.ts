import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { nodeBoardFs } from "./helpers.js";
import { listTasks, getTask } from "../../../src/tasks/utils/board.js";

async function seed() {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  const dir = path.join(repo, "knowledge/tasks/todo");
  await mkdir(dir, { recursive: true });
  await writeFile(
    path.join(dir, "2026-09-13--demo.md"),
    `---
name: demo
description: demo task
metadata:
  edges-type: task
  edges-title: demo task
  edges-tasks-status: todo
---

body
`,
    "utf8",
  );
  await writeFile(
    path.join(dir, ".2026-09-13--demo.log.md"),
    `# Run log: 2026-09-13--demo

| # | agent | started_at | ended_at | status | error_code |
|---|---|---|---|---|---|
| 1 | Agent | 2026-09-13T01:00:00Z |  | running |  |
`,
    "utf8",
  );
  await mkdir(path.join(repo, "knowledge/tasks/.memory"), { recursive: true });
  await writeFile(path.join(repo, "knowledge/tasks/AGENTS.md"), "# tasks\n", "utf8");
  return repo;
}

test("listTasks returns todo item and ignores AGENTS.md / .memory", async () => {
  const repo = await seed();
  try {
    const items = await listTasks(repo, {}, nodeBoardFs());
    assert.equal(items.length, 1);
    assert.equal(items[0]?.stem, "2026-09-13--demo");
    assert.equal(items[0]?.status, "todo");
    assert.equal(items[0]?.runCount, 1);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("listTasks --status backlog is empty when only todo exists", async () => {
  const repo = await seed();
  try {
    const items = await listTasks(repo, { status: "backlog" }, nodeBoardFs());
    assert.equal(items.length, 0);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("getTask by stem and by path", async () => {
  const repo = await seed();
  try {
    const byStem = await getTask(repo, "2026-09-13--demo", nodeBoardFs());
    const byPath = await getTask(repo, "knowledge/tasks/todo/2026-09-13--demo.md", nodeBoardFs());
    assert.equal(byStem.body.trim(), "body");
    assert.equal(byPath.stem, "2026-09-13--demo");
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("getTask missing stem is TASK_NOT_FOUND", async () => {
  const repo = await seed();
  try {
    await getTask(repo, "nope", nodeBoardFs());
    assert.fail("expected throw");
  } catch (error) {
    assert.equal((error as { errorCode: string }).errorCode, "TASK_NOT_FOUND");
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("listTasks and getTask expose priority none when the field is missing", async () => {
  const repo = await seed();
  try {
    const items = await listTasks(repo, {}, nodeBoardFs());
    assert.equal(items[0]?.priority, "none");
    const got = await getTask(repo, "2026-09-13--demo", nodeBoardFs());
    assert.equal(got.priority, "none");
    assert.equal(got.metadata["edges-task-priority"], undefined);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("listTasks and getTask expose written edges-task-priority", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    const dir = path.join(repo, "knowledge/tasks/backlog");
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, "2026-09-16--hot.md"),
      `---
name: hot
description: hot
metadata:
  edges-type: task
  edges-title: hot
  edges-tasks-status: backlog
  edges-task-priority: urgent
---

body
`,
      "utf8",
    );
    const items = await listTasks(repo, {}, nodeBoardFs());
    assert.equal(items[0]?.priority, "urgent");
    const got = await getTask(repo, "2026-09-16--hot", nodeBoardFs());
    assert.equal(got.priority, "urgent");
    assert.equal(got.metadata["edges-task-priority"], "urgent");
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("listTasks treats on-disk P0 as none so the board still lists", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    const dir = path.join(repo, "knowledge/tasks/todo");
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, "2026-09-16--legacy.md"),
      `---
name: legacy
description: legacy
metadata:
  edges-type: task
  edges-title: legacy
  edges-tasks-status: todo
  edges-task-priority: P0
---

body
`,
      "utf8",
    );
    const items = await listTasks(repo, {}, nodeBoardFs());
    assert.equal(items.length, 1);
    assert.equal(items[0]?.priority, "none");
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});
