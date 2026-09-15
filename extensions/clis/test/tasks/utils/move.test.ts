import test from "node:test";
import assert from "node:assert/strict";
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { moveTaskStatus } from "../../../src/tasks/utils/move.js";
import { nodeBoardWriter } from "./helpers.js";

test("moveTaskStatus updates frontmatter and moves Task + sidecar", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    const fromDir = path.join(repo, "knowledge/tasks/todo");
    await mkdir(fromDir, { recursive: true });
    await mkdir(path.join(repo, "knowledge/tasks/in_progress"), { recursive: true });
    await writeFile(
      path.join(fromDir, "2026-09-13--mv.md"),
      `---
name: mv
description: mv
metadata:
  edges-type: task
  edges-title: mv
  edges-tasks-status: todo
---

body
`,
      "utf8",
    );
    await writeFile(path.join(fromDir, ".2026-09-13--mv.log.md"), "# Run log: 2026-09-13--mv\n", "utf8");
    const result = await moveTaskStatus(repo, "2026-09-13--mv", "in_progress", {
      fs: nodeBoardWriter(),
      now: new Date("2026-09-13T12:00:00Z"),
    });
    assert.equal(result.from, "todo");
    assert.equal(result.to, "in_progress");
    const md = await readFile(path.join(repo, result.path), "utf8");
    assert.match(md, /edges-tasks-status: in_progress/);
    await access(path.join(repo, "knowledge/tasks/in_progress/.2026-09-13--mv.log.md"));
    await assert.rejects(access(path.join(fromDir, "2026-09-13--mv.md")));
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("status cancelled keeps both files under cancelled/", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    const fromDir = path.join(repo, "knowledge/tasks/backlog");
    await mkdir(fromDir, { recursive: true });
    await mkdir(path.join(repo, "knowledge/tasks/cancelled"), { recursive: true });
    await writeFile(
      path.join(fromDir, "2026-09-13--stop.md"),
      `---
name: stop
description: stop
metadata:
  edges-type: task
  edges-title: stop
  edges-tasks-status: backlog
---

body
`,
      "utf8",
    );
    await writeFile(path.join(fromDir, ".2026-09-13--stop.log.md"), "# Run log: 2026-09-13--stop\n", "utf8");
    await moveTaskStatus(repo, "2026-09-13--stop", "cancelled", {
      fs: nodeBoardWriter(),
      now: new Date("2026-09-13T12:00:00Z"),
    });
    await access(path.join(repo, "knowledge/tasks/cancelled/2026-09-13--stop.md"));
    await access(path.join(repo, "knowledge/tasks/cancelled/.2026-09-13--stop.log.md"));
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});
