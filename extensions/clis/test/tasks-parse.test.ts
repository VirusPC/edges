import test from "node:test";
import assert from "node:assert/strict";
import { parseArgv } from "../src/parse.js";

test("parseArgv tasks list [--status]", () => {
  const listed = parseArgv(["tasks", "list"]);
  assert.equal(listed.kind, "tasks-list");
  const filtered = parseArgv(["tasks", "list", "--status", "in_progress"]);
  assert.equal(filtered.kind, "tasks-list");
  if (filtered.kind === "tasks-list") assert.equal(filtered.status, "in_progress");
});

test("parseArgv tasks list rejects Run status values", () => {
  const parsed = parseArgv(["tasks", "list", "--status", "completed"]);
  assert.equal(parsed.kind, "error");
  if (parsed.kind === "error") assert.equal(parsed.errorCode, "VALIDATION_ERROR");
});

test("parseArgv tasks get/create/update/status/runs/run-messages", () => {
  assert.equal(parseArgv(["tasks", "get", "stem-1"]).kind, "tasks-get");
  const created = parseArgv(["tasks", "create", "--title", "Hello"]);
  assert.equal(created.kind, "tasks-create");
  if (created.kind === "tasks-create") assert.equal(created.status, "backlog");
  assert.equal(parseArgv(["tasks", "update", "stem-1", "--title", "N"]).kind, "tasks-update");
  const moved = parseArgv(["tasks", "status", "stem-1", "cancelled"]);
  assert.equal(moved.kind, "tasks-status");
  const runs = parseArgv(["tasks", "runs", "stem-1"]);
  assert.equal(runs.kind, "tasks-runs");
  if (runs.kind === "tasks-runs") assert.equal(runs.output, "table");
  const jsonRuns = parseArgv(["tasks", "runs", "stem-1", "--output", "json"]);
  assert.equal(jsonRuns.kind, "tasks-runs");
  if (jsonRuns.kind === "tasks-runs") assert.equal(jsonRuns.output, "json");
  const msgs = parseArgv(["tasks", "run-messages", "stem-1--1"]);
  assert.equal(msgs.kind, "tasks-run-messages");
});

test("parseArgv has no delete command", () => {
  const parsed = parseArgv(["tasks", "delete", "stem"]);
  assert.equal(parsed.kind, "error");
});

test("parseArgv rejects tasks delete, log, and missing subcommand", () => {
  for (const argv of [["tasks"], ["tasks", "delete", "x"], ["tasks", "log", "x"]] as string[][]) {
    const parsed = parseArgv(argv);
    assert.equal(parsed.kind, "error");
    if (parsed.kind === "error") assert.equal(parsed.errorCode, "VALIDATION_ERROR");
  }
});

test("parseArgv tasks --help is help and lists subcommands", () => {
  const parsed = parseArgv(["tasks", "--help"]);
  assert.equal(parsed.kind, "help");
  if (parsed.kind === "help") {
    assert.match(parsed.text, /\blist\b/);
    assert.match(parsed.text, /\brun-messages\b/);
    assert.doesNotMatch(parsed.text, /not implemented/i);
  }
});
