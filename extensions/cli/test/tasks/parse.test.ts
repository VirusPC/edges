import test from "node:test";
import assert from "node:assert/strict";
import { access, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { run } from "../../src/program.js";

function failedJson(stdout: string): { status: string; errorCode: string } {
  return JSON.parse(stdout) as { status: string; errorCode: string };
}

test("run tasks list [--status]", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-tasks-"));
  try {
    await mkdir(path.join(repo, "knowledge/tasks/_default/backlog"), { recursive: true });
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
    await mkdir(path.join(repo, "knowledge/tasks/_default/backlog"), { recursive: true });
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

test("run tasks list --sort status is VALIDATION_ERROR", async () => {
  const result = await run(["tasks", "list", "--sort", "status"]);
  assert.equal(result.exitCode, 2);
  assert.equal(failedJson(result.stdout).errorCode, "VALIDATION_ERROR");
});

test("run tasks list --priority P0 is VALIDATION_ERROR", async () => {
  const result = await run(["tasks", "list", "--priority", "P0"]);
  assert.equal(result.exitCode, 2);
  assert.equal(failedJson(result.stdout).errorCode, "VALIDATION_ERROR");
});

test("run tasks update --priority Urgent is VALIDATION_ERROR", async () => {
  const result = await run(["tasks", "update", "stem", "--priority", "Urgent"]);
  assert.equal(result.exitCode, 2);
  assert.equal(failedJson(result.stdout).errorCode, "VALIDATION_ERROR");
});

test("run tasks create --priority P0 is VALIDATION_ERROR", async () => {
  const result = await run(["tasks", "create", "--title", "Pri", "--priority", "P0"]);
  assert.equal(result.exitCode, 2);
  assert.equal(failedJson(result.stdout).errorCode, "VALIDATION_ERROR");
});

test("run tasks create --project Default is VALIDATION_ERROR", async () => {
  const result = await run(["tasks", "create", "--title", "Pri", "--project", "Default"]);
  assert.equal(result.exitCode, 2);
  assert.equal(failedJson(result.stdout).errorCode, "VALIDATION_ERROR");
});

test("run tasks create --project in_progress is VALIDATION_ERROR", async () => {
  const result = await run(["tasks", "create", "--title", "Pri", "--project", "in_progress"]);
  assert.equal(result.exitCode, 2);
  assert.equal(failedJson(result.stdout).errorCode, "VALIDATION_ERROR");
});

test("run tasks update --project Default is VALIDATION_ERROR", async () => {
  const result = await run(["tasks", "update", "stem", "--project", "Default"]);
  assert.equal(result.exitCode, 2);
  assert.equal(failedJson(result.stdout).errorCode, "VALIDATION_ERROR");
});

test("run tasks list --project in_progress is VALIDATION_ERROR", async () => {
  const result = await run(["tasks", "list", "--project", "in_progress"]);
  assert.equal(result.exitCode, 2);
  assert.equal(JSON.parse(result.stdout).errorCode, "VALIDATION_ERROR");
});

test("run tasks --help is help and lists subcommands", async () => {
  const result = await run(["tasks", "--help"]);
  assert.equal(result.exitCode, 0);
  assert.match(result.stdout, /\blist\b/);
  assert.match(result.stdout, /\brun-messages\b/);
  assert.doesNotMatch(result.stdout, /not implemented/i);
});

test("run tasks classify is VALIDATION_ERROR", async () => {
  const result = await run(["tasks", "classify"]);
  assert.equal(result.exitCode, 2);
  assert.equal(failedJson(result.stdout).errorCode, "VALIDATION_ERROR");
});

test("run tasks project review-page --from fixture writes html and returns path", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "edges-rp-cli-"));
  try {
    const fixture = path.join(dir, "in.json");
    const out = path.join(dir, "out.html");
    await writeFile(
      fixture,
      JSON.stringify({
        groups: [
          { id: "default", title: "Default", description: "u" },
          { id: "cli", title: "CLI", description: "c" },
        ],
        items: [
          { stem: "2026-09-13--demo", current: "default", suggested: "cli", title: "Demo" },
        ],
      }),
      "utf8",
    );
    const result = await run(
      ["tasks", "project", "review-page", "--from", fixture, "--out", out],
      { env: { ...process.env, EDGES_REPO: dir } },
    );
    assert.equal(result.exitCode, 0);
    const payload = JSON.parse(result.stdout);
    assert.equal(payload.status, "success");
    assert.equal(payload.command, "project.review-page");
    assert.equal(payload.path, path.resolve(out));
    assert.equal(payload.itemCount, 1);
    assert.equal(payload.groupCount, 2);
    const html = await readFile(out, "utf8");
    assert.match(html, /2026-09-13--demo/);
    assert.match(html, /edges-review-payload/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("run tasks project review-page --from bad json is VALIDATION_ERROR", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "edges-rp-bad-"));
  try {
    const fixture = path.join(dir, "bad.json");
    await writeFile(fixture, "{", "utf8");
    const out = path.join(dir, "out.html");
    const result = await run(
      ["tasks", "project", "review-page", "--from", fixture, "--out", out],
      { env: { ...process.env, EDGES_REPO: dir } },
    );
    assert.equal(result.exitCode, 2);
    const payload = JSON.parse(result.stdout);
    assert.equal(payload.status, "failed");
    assert.equal(payload.errorCode, "VALIDATION_ERROR");
    await assert.rejects(() => access(out));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("run tasks project review-page --from missing file is VALIDATION_ERROR", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "edges-rp-miss-"));
  try {
    const missing = path.join(dir, "nope.json");
    const result = await run(["tasks", "project", "review-page", "--from", missing], {
      env: { ...process.env, EDGES_REPO: dir },
    });
    assert.equal(result.exitCode, 2);
    const payload = JSON.parse(result.stdout);
    assert.equal(payload.status, "failed");
    assert.equal(payload.errorCode, "VALIDATION_ERROR");
    assert.match(payload.reason, /review-page --from file not readable:/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("run tasks project review-page --from - writes html from stdinText", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "edges-rp-stdin-"));
  try {
    const out = path.join(dir, "out.html");
    const result = await run(
      ["tasks", "project", "review-page", "--from", "-", "--out", out],
      {
        env: { ...process.env, EDGES_REPO: dir },
        stdinText: JSON.stringify({
          groups: [{ id: "default", title: "Default" }],
          items: [{ stem: "2026-09-13--demo", current: "default", suggested: "default" }],
        }),
      },
    );
    assert.equal(result.exitCode, 0);
    const payload = JSON.parse(result.stdout);
    assert.equal(payload.command, "project.review-page");
    assert.equal(payload.path, path.resolve(out));
    assert.match(await readFile(out, "utf8"), /2026-09-13--demo/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("run tasks project review-page --from - with empty stdin is VALIDATION_ERROR", async () => {
  const result = await run(["tasks", "project", "review-page", "--from", "-"], {
    stdinText: "",
  });
  assert.equal(result.exitCode, 2);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.status, "failed");
  assert.equal(payload.errorCode, "VALIDATION_ERROR");
  assert.match(payload.reason, /review-page stdin is empty/);
});

test("run tasks project without subcommand is VALIDATION_ERROR", async () => {
  const result = await run(["tasks", "project"]);
  assert.equal(result.exitCode, 2);
  assert.equal(failedJson(result.stdout).errorCode, "VALIDATION_ERROR");
  assert.match(JSON.parse(result.stdout).reason, /missing project subcommand/);
});
