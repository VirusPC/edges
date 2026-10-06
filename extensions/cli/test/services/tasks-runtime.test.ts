import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { openTasksRuntime } from "../../src/services/tasks/result.js";

test("tasks service result module does not mention CliContext", () => {
  const source = readFileSync(new URL("../../src/services/tasks/result.ts", import.meta.url), "utf8");
  assert.equal(source.includes("CliContext"), false);
  assert.equal(source.includes("CliResult"), false);
});

test("openTasksRuntime accepts env without a command context", () => {
  const runtime = openTasksRuntime({
    env: { EDGES_REPO: "/tmp/edges-fixture", EDGES_SCOPE: "/tmp/edges-fixture" },
    purpose: "domain",
  });
  assert.equal(typeof runtime.now, "object");
  assert.ok(runtime.location);
});
