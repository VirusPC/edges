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
