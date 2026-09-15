import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { run } from "../../src/program.js";

function failedJson(stdout: string): { status: string; errorCode: string } {
  return JSON.parse(stdout) as { status: string; errorCode: string };
}

test("run tasks list [--status]", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    await mkdir(path.join(repo, "knowledge/tasks/backlog"), { recursive: true });
    const listed = await run(["tasks", "list"], { env: { ...process.env, EDGES_REPO: repo } });
    assert.equal(listed.exitCode, 0);
    assert.equal(JSON.parse(listed.stdout).command, "list");
    const filtered = await run(["tasks", "list", "--status", "in_progress"], {
      env: { ...process.env, EDGES_REPO: repo },
    });
    assert.equal(filtered.exitCode, 0);
    assert.equal(JSON.parse(filtered.stdout).command, "list");
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("run tasks list rejects Run status values", async () => {
  const result = await run(["tasks", "list", "--status", "completed"]);
  assert.equal(result.exitCode, 2);
  assert.equal(failedJson(result.stdout).errorCode, "VALIDATION_ERROR");
});

test("run tasks get/create/update/status/runs/run-messages", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    await mkdir(path.join(repo, "knowledge/tasks/backlog"), { recursive: true });
    const env = { ...process.env, EDGES_REPO: repo };
    const created = await run(["tasks", "create", "--title", "Hello"], { env });
    assert.equal(created.exitCode, 0);
    assert.equal(JSON.parse(created.stdout).command, "create");

    const get = await run(["tasks", "get", "stem-1"], { env });
    assert.equal(get.exitCode, 1);
    assert.equal(failedJson(get.stdout).errorCode, "TASK_NOT_FOUND");

    const updated = await run(["tasks", "update", "stem-1", "--title", "N"], { env });
    assert.equal(updated.exitCode, 1);
    assert.equal(failedJson(updated.stdout).errorCode, "TASK_NOT_FOUND");

    const moved = await run(["tasks", "status", "stem-1", "cancelled"], { env });
    assert.equal(moved.exitCode, 1);
    assert.equal(failedJson(moved.stdout).errorCode, "TASK_NOT_FOUND");

    const runs = await run(["tasks", "runs", "stem-1"], { env });
    assert.equal(runs.exitCode, 1);
    assert.equal(failedJson(runs.stdout).errorCode, "TASK_NOT_FOUND");

    const jsonRuns = await run(["tasks", "runs", "stem-1", "--output", "json"], { env });
    assert.equal(jsonRuns.exitCode, 1);
    assert.equal(failedJson(jsonRuns.stdout).errorCode, "TASK_NOT_FOUND");

    const msgs = await run(["tasks", "run-messages", "stem-1--1"], { env });
    assert.equal(msgs.exitCode, 1);
    assert.ok(["TASK_NOT_FOUND", "RUN_NOT_FOUND"].includes(failedJson(msgs.stdout).errorCode));
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("run has no delete command", async () => {
  const result = await run(["tasks", "delete", "stem"]);
  assert.equal(result.exitCode, 2);
  assert.equal(failedJson(result.stdout).errorCode, "VALIDATION_ERROR");
});

test("run rejects tasks delete, log, and missing subcommand", async () => {
  for (const argv of [["tasks"], ["tasks", "delete", "x"], ["tasks", "log", "x"]] as string[][]) {
    const result = await run(argv);
    assert.equal(result.exitCode, 2);
    assert.equal(failedJson(result.stdout).errorCode, "VALIDATION_ERROR");
  }
});

test("run tasks --help is help and lists subcommands", async () => {
  const result = await run(["tasks", "--help"]);
  assert.equal(result.exitCode, 0);
  assert.match(result.stdout, /\blist\b/);
  assert.match(result.stdout, /\brun-messages\b/);
  assert.doesNotMatch(result.stdout, /not implemented/i);
});
