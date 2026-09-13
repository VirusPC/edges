import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createTask, updateTask } from "../src/tasks/write.js";
import { nodeBoardWriter } from "./tasks-helpers.js";

test("createTask writes Task + empty sidecar under backlog and does not need git", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    await mkdir(path.join(repo, "knowledge/tasks/backlog"), { recursive: true });
    const now = new Date(2026, 8, 13, 12, 0, 0);
    const created = await createTask(
      repo,
      { title: "New CLI work", status: "backlog" },
      { fs: nodeBoardWriter(), now },
    );
    assert.equal(created.stem, "2026-09-13--New-CLI-work");
    const md = await readFile(path.join(repo, created.path), "utf8");
    assert.match(md, /edges-tasks-status: backlog/);
    assert.match(md, /\*\*Why:\*\*/);
    const log = await readFile(path.join(repo, created.sidecarPath), "utf8");
    assert.match(log, /# Run log: 2026-09-13--New-CLI-work/);
    assert.match(log, /## Notes/);
    assert.doesNotMatch(log, /^\| 1 \|/m);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("createTask suffixes -2 when stem exists", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    await mkdir(path.join(repo, "knowledge/tasks/backlog"), { recursive: true });
    const now = new Date(2026, 8, 13, 12, 0, 0);
    const io = { fs: nodeBoardWriter(), now };
    const first = await createTask(repo, { title: "Dup", status: "backlog" }, io);
    const second = await createTask(repo, { title: "Dup", status: "backlog" }, io);
    assert.equal(first.stem, "2026-09-13--Dup");
    assert.equal(second.stem, "2026-09-13--Dup-2");
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("updateTask changes title and body and keeps path", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    const now = new Date(2026, 8, 13, 12, 0, 0);
    await mkdir(path.join(repo, "knowledge/tasks/todo"), { recursive: true });
    const created = await createTask(
      repo,
      { title: "Stay", status: "todo" },
      { fs: nodeBoardWriter(), now },
    );
    const updated = await updateTask(
      repo,
      created.stem,
      { title: "New title", body: "replaced\n" },
      { fs: nodeBoardWriter(), now: new Date(2026, 8, 13, 13, 0, 0) },
    );
    assert.equal(updated.path, created.path);
    const md = await readFile(path.join(repo, updated.path), "utf8");
    assert.match(md, /edges-title: New title/);
    assert.match(md, /^replaced$/m);
    assert.match(md, /edges-tasks-status: todo/);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});
