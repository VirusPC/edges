import test from "node:test";
import assert from "node:assert/strict";
import { parseArgv } from "../../src/program.js";

test("tasks help lists seven verbs and omits delete/log", () => {
  const parsed = parseArgv(["tasks", "--help"]);
  assert.equal(parsed.kind, "help");
  if (parsed.kind !== "help") {
    return;
  }
  for (const verb of ["list", "get", "create", "update", "status", "runs", "run-messages"]) {
    assert.match(parsed.text, new RegExp(`\\b${verb}\\b`));
  }
  assert.doesNotMatch(parsed.text, /^\s+delete\b/m);
  assert.doesNotMatch(parsed.text, /^\s+log\b/m);
});
