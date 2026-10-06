import test from "node:test";
import assert from "node:assert/strict";
import { exitCodeForErrorCode } from "../../src/commands/exit.js";

test("exit codes follow validation, auth, and other", () => {
  assert.equal(exitCodeForErrorCode("VALIDATION_ERROR"), 2);
  assert.equal(exitCodeForErrorCode("AUTH_MISSING"), 4);
  assert.equal(exitCodeForErrorCode("AUTH_INVALID_TOKEN"), 4);
  assert.equal(exitCodeForErrorCode("TASK_NOT_FOUND"), 1);
  assert.equal(exitCodeForErrorCode("UNKNOWN_ERROR"), 1);
});
