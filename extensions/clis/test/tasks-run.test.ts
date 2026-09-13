import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { run } from "../src/run.js";

test("run tasks list returns JSON tasks from EDGES_REPO", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    const dir = path.join(repo, "knowledge/tasks/backlog");
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, "2026-09-13--listed.md"),
      `---
name: listed
description: listed
metadata:
  edges-type: task
  edges-title: listed
  edges-tasks-status: backlog
---

x
`,
      "utf8",
    );
    const result = await run(["tasks", "list"], { env: { ...process.env, EDGES_REPO: repo } });
    assert.equal(result.exitCode, 0);
    const body = JSON.parse(result.stdout) as { status: string; command: string; tasks: { stem: string }[] };
    assert.equal(body.status, "success");
    assert.equal(body.command, "list");
    assert.equal(body.tasks[0]?.stem, "2026-09-13--listed");
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("run tasks get returns the task body", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    const dir = path.join(repo, "knowledge/tasks/todo");
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, "2026-09-13--got.md"),
      `---
name: got
description: got
metadata:
  edges-type: task
  edges-title: got
  edges-tasks-status: todo
---

hello body
`,
      "utf8",
    );
    const result = await run(["tasks", "get", "2026-09-13--got"], { env: { ...process.env, EDGES_REPO: repo } });
    assert.equal(result.exitCode, 0);
    const body = JSON.parse(result.stdout) as { command: string; task: { body: string; stem: string } };
    assert.equal(body.command, "get");
    assert.equal(body.task.stem, "2026-09-13--got");
    assert.match(body.task.body, /hello body/);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("run tasks get missing exits 1 with TASK_NOT_FOUND", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    await mkdir(path.join(repo, "knowledge/tasks/backlog"), { recursive: true });
    const result = await run(["tasks", "get", "missing"], { env: { ...process.env, EDGES_REPO: repo } });
    assert.equal(result.exitCode, 1);
    const body = JSON.parse(result.stdout) as { errorCode: string };
    assert.equal(body.errorCode, "TASK_NOT_FOUND");
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("run tasks create is JSON and skips git", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    await mkdir(path.join(repo, "knowledge/tasks/backlog"), { recursive: true });
    const result = await run(["tasks", "create", "--title", "From CLI"], {
      env: { ...process.env, EDGES_REPO: repo },
    });
    assert.equal(result.exitCode, 0);
    const body = JSON.parse(result.stdout) as { command: string; path: string; stem: string };
    assert.equal(body.command, "create");
    assert.match(body.path, /knowledge\/tasks\/backlog\//);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("run tasks update without flags is VALIDATION_ERROR", async () => {
  const result = await run(["tasks", "update", "stem"]);
  assert.equal(result.exitCode, 2);
  assert.equal(JSON.parse(result.stdout).errorCode, "VALIDATION_ERROR");
});
