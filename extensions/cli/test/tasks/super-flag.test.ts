import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, realpathSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { run } from "../../src/program.js";
import { AgentsNode, TaskNode } from "../../src/domain/models/index.js";

function fixture(t: { after(fn: () => void): void }) {
  const root = mkdtempSync(path.join(realpathSync(tmpdir()), "super-flag-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  execFileSync("git", ["init", "-q", root]);
  const write = (rel: string, body: string) => {
    const file = path.join(root, rel);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, body);
  };
  const index = (rel: string, children: string[]) => {
    const file = path.join(root, rel);
    write(rel, "# Project\n\nDescription\n\n" + new AgentsNode(file).create({
      localChildren: children.map((id) => ({ id: path.resolve(path.dirname(file), id) })),
    }, { operation: "create" }).serialize());
  };
  index("tasks/AGENTS.md", ["alpha/AGENTS.md"]);
  index("tasks/alpha/AGENTS.md", ["todo/one/index.md"]);
  write("tasks/alpha/todo/one/index.md", new TaskNode(path.join(root, "tasks/alpha/todo/one/index.md")).create({
    name: "One", status: "todo",
    metadata: { metadata: { "edges-task-project": "alpha", "edges-task-priority": "low" } },
  }, { operation: "create" }).serialize());
  write("README.md", "# Edges\n\n<!-- project-entries-local:start -->\n## 本层内容\n\n- [领域任务](tasks/AGENTS.md) — 看板。\n<!-- project-entries-local:end -->\n");
  return root;
}

test("--super lists tasks through the root README without writing AGENTS.md", async (t) => {
  const root = fixture(t);
  const result = await run(["--scope", root, "--super", "tasks", "list"], { env: {} });
  assert.equal(result.exitCode, 0, result.stdout + result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.deepEqual(payload.tasks.map((task: { path: string }) => task.path), ["tasks/alpha/todo/one/index.md"]);
  assert.equal(existsSync(path.join(root, "AGENTS.md")), false);
});

test("without --super a scope lacking AGENTS fails clearly", async (t) => {
  const root = fixture(t);
  const result = await run(["--scope", root, "tasks", "list", "--all-scopes"], { env: {} });
  assert.notEqual(result.exitCode, 0);
  assert.match(result.stdout + result.stderr, /--super/);
});
