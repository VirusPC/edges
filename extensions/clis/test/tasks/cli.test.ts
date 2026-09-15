import test from "node:test";
import assert from "node:assert/strict";
import { run } from "../../src/program.js";

test("tasks help lists seven verbs and omits delete/log", async () => {
  const result = await run(["tasks", "--help"]);
  assert.equal(result.exitCode, 0);
  for (const verb of ["list", "get", "create", "update", "status", "runs", "run-messages"]) {
    assert.match(result.stdout, new RegExp(`\\b${verb}\\b`));
  }
  assert.doesNotMatch(result.stdout, /^\s+delete\b/m);
  assert.doesNotMatch(result.stdout, /^\s+log\b/m);
});
