import test from "node:test";
import assert from "node:assert/strict";
import { run } from "../../src/program.js";

test("tasks help has review-page and destination flags without a separate project command", async () => {
  const help = await run(["tasks", "--help"]);
  assert.equal(help.exitCode, 0);
  assert.match(help.stdout, /review-page/);
  assert.match(help.stdout, /--to-project/);
  assert.match(help.stdout, /--to-default/);
  assert.doesNotMatch(help.stdout, /project create|project list|edges-task-project/);
  const removed = await run(["tasks", "project", "list"]);
  assert.equal(removed.exitCode, 2);
});
test("local create and status flags do not shadow the root project selection", async () => {
  for (const verb of ["create","status"]) {
    const help = await run(["tasks",verb,"--help"]);
    assert.equal(help.exitCode,0);
    assert.doesNotMatch(help.stdout,/edges-task-project/);
  }
});
