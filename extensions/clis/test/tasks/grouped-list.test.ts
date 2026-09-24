import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { run } from "../../src/program.js";

function failedJson(stdout: string): { status: string; errorCode: string } {
  return JSON.parse(stdout) as { status: string; errorCode: string };
}

test("flat list is unchanged without --group-by", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-grouped-"));
  try {
    const env = { ...process.env, EDGES_REPO: repo };
    await run(["tasks", "create", "--title", "Alpha", "--status", "todo"], { env });
    const result = await run(["tasks", "list"], { env });
    assert.equal(result.exitCode, 0);
    const body = JSON.parse(result.stdout) as {
      status: string;
      command: string;
      schema?: string;
      groups?: unknown;
      tasks: Array<{ stem: string; doc?: unknown }>;
    };
    assert.equal(body.status, "success");
    assert.equal(body.command, "list");
    assert.equal(body.schema, undefined);
    assert.equal(body.groups, undefined);
    assert.ok(Array.isArray(body.tasks));
    assert.equal(body.tasks.length, 1);
    assert.equal("doc" in body.tasks[0]!, false);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("list --group-by project --format json emits edges.tasks.grouped/v1", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-grouped-"));
  try {
    const env = { ...process.env, EDGES_REPO: repo };
    await run(["tasks", "create", "--title", "Alpha", "--status", "todo"], { env });
    const result = await run(["tasks", "list", "--group-by", "project", "--format", "json"], { env });
    assert.equal(result.exitCode, 0);
    const body = JSON.parse(result.stdout) as {
      status: string;
      command: string;
      schema: string;
      groups: Array<{ id: string; title: string; description?: string }>;
      items: Array<{
        id?: string;
        stem?: string;
        group: string;
        title?: string;
        status?: string;
        doc?: { name?: string; body?: unknown; metadata: Record<string, string> };
      }>;
      tasks?: unknown;
    };
    assert.equal(body.status, "success");
    assert.equal(body.command, "list");
    assert.equal(body.schema, "edges.tasks.grouped/v1");
    assert.ok(body.groups.some((group) => group.id === "default" && group.title));
    assert.equal(body.tasks, undefined);
    const item = body.items[0];
    assert.ok(item?.id || item?.stem);
    assert.equal(item?.group, "default");
    assert.equal(item?.title, "Alpha");
    assert.equal(item?.status, "todo");
    assert.equal(item?.doc?.name !== undefined, true);
    assert.equal(typeof item?.doc?.body, "string");
    assert.equal(item?.doc?.metadata["edges-tasks-status"], "todo");
    assert.equal("rawFrontmatter" in (item?.doc ?? {}), false);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("list filters apply before grouping", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-grouped-"));
  try {
    const env = { ...process.env, EDGES_REPO: repo };
    await run(
      ["tasks", "create", "--title", "KeepHigh", "--status", "todo", "--project", "cli", "--priority", "high"],
      { env },
    );
    await run(
      ["tasks", "create", "--title", "KeepUrgent", "--status", "todo", "--project", "docs", "--priority", "urgent"],
      { env },
    );
    await run(
      ["tasks", "create", "--title", "SkipStatus", "--status", "backlog", "--project", "cli", "--priority", "high"],
      { env },
    );
    await run(
      ["tasks", "create", "--title", "SkipPriority", "--status", "todo", "--project", "docs", "--priority", "low"],
      { env },
    );
    await run(
      ["tasks", "create", "--title", "SkipProject", "--status", "todo", "--project", "other", "--priority", "high"],
      { env },
    );
    const result = await run(
      [
        "tasks",
        "list",
        "--group-by",
        "project",
        "--format",
        "json",
        "--status",
        "todo",
        "--project",
        "cli",
        "--project",
        "docs",
        "--priority",
        "high",
        "--priority",
        "urgent",
        "--sort",
        "priority",
      ],
      { env },
    );
    assert.equal(result.exitCode, 0);
    const body = JSON.parse(result.stdout) as {
      groups: Array<{ id: string }>;
      items: Array<{ title?: string; group: string; priority?: string }>;
    };
    assert.deepEqual(
      body.groups.map((group) => group.id),
      ["cli", "docs"],
    );
    assert.deepEqual(
      body.items.map((item) => item.title),
      ["KeepUrgent", "KeepHigh"],
    );
    assert.deepEqual(
      body.items.map((item) => item.priority),
      ["urgent", "high"],
    );
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("list --group-by status and --format table are VALIDATION_ERROR", async () => {
  const byStatus = await run(["tasks", "list", "--group-by", "status"]);
  assert.equal(byStatus.exitCode, 2);
  assert.equal(failedJson(byStatus.stdout).errorCode, "VALIDATION_ERROR");

  const table = await run(["tasks", "list", "--format", "table"]);
  assert.equal(table.exitCode, 2);
  assert.equal(failedJson(table.stdout).errorCode, "VALIDATION_ERROR");
});

test("list --help documents grouped schema and omits review-page", async () => {
  const result = await run(["tasks", "list", "--help"]);
  assert.equal(result.exitCode, 0);
  assert.match(result.stdout, /--group-by/);
  assert.match(result.stdout, /edges\.tasks\.grouped\/v1/);
  assert.doesNotMatch(result.stdout, /review-page/);
});
