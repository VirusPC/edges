import test from "node:test";
import assert from "node:assert/strict";
import { fail, succeed, usageErrorCode } from "../../src/commands/result.js";

test("fail writes status JSON on stdout and the hint on stderr", () => {
  const result = fail("VALIDATION_ERROR", "missing title", "See edges tasks --help\n");
  assert.equal(result.exitCode, 2);
  assert.equal(result.stderr, "See edges tasks --help\n");
  assert.deepEqual(JSON.parse(result.stdout), {
    status: "failed",
    errorCode: "VALIDATION_ERROR",
    reason: "missing title",
  });
});

test("succeed writes status success", () => {
  const result = succeed({ command: "get", task: { stem: "a" } });
  assert.equal(result.exitCode, 0);
  assert.equal(result.stderr, "");
  assert.deepEqual(JSON.parse(result.stdout), {
    status: "success",
    command: "get",
    task: { stem: "a" },
  });
});

test("commander usage codes are validation errors", () => {
  assert.equal(usageErrorCode("commander.invalidArgument"), "VALIDATION_ERROR");
  assert.equal(usageErrorCode("commander.unknownCommand"), null);
});
