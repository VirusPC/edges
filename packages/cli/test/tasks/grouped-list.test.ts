import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { run } from "../../src/program.js";

function failedJson(stdout: string): { status: string; errorCode: string } {
  return JSON.parse(stdout) as { status: string; errorCode: string };
}

test("flat list is unchanged without --group-by", async () => {
  const repo = await mkdtemp(path.join(realpathSync(tmpdir()), "edges-grouped-"));
  try {
    const env = { ...process.env, EDGES_REPO: repo };
    await run(["--super", "tasks", "create", "--title", "Alpha", "--status", "todo"], { env });
    const result = await run(["--super", "tasks", "list"], { env });
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

test("list --group-by project emits groups of items", async () => {
  const repo = await mkdtemp(path.join(realpathSync(tmpdir()), "edges-grouped-"));
  try {
    const env = { ...process.env, EDGES_REPO: repo };
    await run(["--super", "tasks", "create", "--title", "Alpha", "--status", "todo"], { env });
    const result = await run(["--super", "tasks", "list", "--group-by", "project", "--format", "json"], { env });
    assert.equal(result.exitCode, 0);
    const body = JSON.parse(result.stdout) as {
      status: string;
      command: string;
      groupBy: string;
      groups: Array<{ key: string; items: Array<{ stem?: string; title?: string; status?: string; doc?: { name?: string; body?: unknown; metadata: Record<string, string> } }> }>;
      tasks?: unknown;
      schema?: string;
    };
    assert.equal(body.status, "success");
    assert.equal(body.command, "list");
    assert.equal(body.groupBy, "project");
    assert.equal(body.schema, undefined);
    assert.equal(body.tasks, undefined);
    const group = body.groups.find((entry) => entry.key === "__undefined__");
    assert.ok(group);
    assert.equal(group?.items[0]?.title, "Alpha");
    assert.equal(group?.items[0]?.status, "todo");
    // doc is optional in the grouped envelope; task identity remains required.
    assert.equal(typeof group?.items[0]?.stem, "string");
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("list --format table is VALIDATION_ERROR and --group-by status is allowed", async () => {
  const repo = await mkdtemp(path.join(realpathSync(tmpdir()), "edges-grouped-"));
  try {
    const byStatus = await run(["--super", "tasks", "list", "--group-by", "status"], {
      env: { ...process.env, EDGES_REPO: repo },
    });
    assert.equal(byStatus.exitCode, 0);
    assert.equal(JSON.parse(byStatus.stdout).groupBy, "status");
  } finally {
    await rm(repo, { recursive: true, force: true });
  }

  const table = await run(["--super", "tasks", "list", "--format", "table"]);
  assert.equal(table.exitCode, 2);
  assert.equal(failedJson(table.stdout).errorCode, "VALIDATION_ERROR");
});

test("list --help documents grouped schema and omits review-page", async () => {
  const result = await run(["--super", "tasks", "list", "--help"]);
  assert.equal(result.exitCode, 0);
  assert.match(result.stdout, /--group-by/);
  assert.match(result.stdout, /--filter/);
  assert.doesNotMatch(result.stdout, /edges\.tasks\.grouped\/v1/);
  assert.doesNotMatch(result.stdout, /review-page/);
});
