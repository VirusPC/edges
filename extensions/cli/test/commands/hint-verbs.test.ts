import test from "node:test";
import assert from "node:assert/strict";
import { run } from "../../src/program.js";

function failed(stdout: string): { status: string; errorCode: string; reason: string } {
  return JSON.parse(stdout) as { status: string; errorCode: string; reason: string };
}

test("memory create and update point at remember", async () => {
  for (const verb of ["create", "update"] as const) {
    const result = await run(["memory", verb]);
    assert.equal(result.exitCode, 2);
    const body = failed(result.stdout);
    assert.equal(body.errorCode, "VALIDATION_ERROR");
    assert.match(body.reason, new RegExp(`edges memory ${verb} does not write`));
    assert.match(body.reason, /edges memory remember/);
  }
});

test("skill create and update point at remember", async () => {
  for (const verb of ["create", "update"] as const) {
    const result = await run(["skills", verb]);
    assert.equal(result.exitCode, 2);
    const body = failed(result.stdout);
    assert.equal(body.errorCode, "VALIDATION_ERROR");
    assert.match(body.reason, /edges memory remember/);
    assert.match(body.reason, /SKILL\.md/);
  }
});
