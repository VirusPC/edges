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

test("tasks help documents priority on list create update and not on status", async () => {
  const root = await run(["tasks", "--help"]);
  assert.match(root.stdout, /--priority/);
  assert.match(root.stdout, /--sort priority/);

  const list = await run(["tasks", "list", "--help"]);
  assert.match(list.stdout, /--priority/);
  assert.match(list.stdout, /--sort/);

  const create = await run(["tasks", "create", "--help"]);
  assert.match(create.stdout, /--priority/);

  const update = await run(["tasks", "update", "--help"]);
  assert.match(update.stdout, /--priority/);

  const status = await run(["tasks", "status", "--help"]);
  assert.doesNotMatch(status.stdout, /--priority/);
});
