import test from "node:test";
import assert from "node:assert/strict";
import { run } from "../../src/program.js";

const ALIGNED = ["notes", "tasks", "memory", "skills", "artifacts", "schema", "forest"] as const;

test("root help lists folder-aligned command names", async () => {
  const result = await run(["--help"]);
  assert.equal(result.exitCode, 0);
  for (const name of ALIGNED) {
    assert.match(result.stdout, new RegExp(`^\\s+${name}\\b`, "m"));
  }
  assert.doesNotMatch(result.stdout, /^\s+note\b/m);
  assert.doesNotMatch(result.stdout, /^\s+skill\b/m);
});

test("edges skills --help lists skill verbs", async () => {
  const result = await run(["skills", "--help"]);
  assert.equal(result.exitCode, 0);
  for (const verb of ["list", "get", "create", "update", "delete"]) {
    assert.match(result.stdout, new RegExp(`^\\s+${verb}\\b`, "m"));
  }
});

test("edges notes --help lists note verbs", async () => {
  const result = await run(["notes", "--help"]);
  assert.equal(result.exitCode, 0);
  for (const verb of ["list", "get", "create", "update", "delete"]) {
    assert.match(result.stdout, new RegExp(`^\\s+${verb}\\b`, "m"));
  }
  assert.match(result.stdout, /edges notes create/);
});

test("removed singular commands are unknown", async () => {
  for (const name of ["skill", "note"] as const) {
    const result = await run([name]);
    assert.equal(result.exitCode, 2);
    const body = JSON.parse(result.stdout) as { reason: string };
    assert.match(body.reason, /too many arguments/);
    assert.doesNotMatch(body.reason, new RegExp(`edges ${name}\\b`));
  }
});
