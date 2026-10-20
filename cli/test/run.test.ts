import test from "node:test";
import assert from "node:assert/strict";
import { run } from "../src/program.js";

const requiredNoteFlags = [
  "--title",
  "Title",
  "--body",
  "Body",
] as const;

test("run --help lists note and tasks", async () => {
  const result = await run(["--help"]);
  assert.equal(result.exitCode, 0);
  assert.match(result.stdout, /Commands:/);
  assert.match(result.stdout, /^\s+notes\b/m);
  assert.match(result.stdout, /^\s+tasks\b/m);
  assert.match(result.stdout, /^\s+artifacts\b/m);
  assert.doesNotMatch(result.stdout, /^\s+ingest\b/m);
});

test("run note --help documents local create flags and structured output", async () => {
  const result = await run(["notes", "--help"]);
  assert.equal(result.exitCode, 0);
  assert.match(result.stdout, /--title/);
  assert.match(result.stdout, /--body/);
  assert.match(result.stdout, /--json/);
  assert.match(result.stdout, /STRUCTURED OUTPUT/);
  assert.doesNotMatch(result.stdout, /--co-author|--content\b/);
});

test("run tasks --help lists subcommands and not the placeholder", async () => {
  const result = await run(["tasks", "--help"]);
  assert.equal(result.exitCode, 0);
  assert.match(result.stdout, /\blist\b/);
  assert.match(result.stdout, /\brun-messages\b/);
  assert.doesNotMatch(result.stdout, /not implemented/i);
});

test("run tasks without subcommand is usage JSON", async () => {
  const result = await run(["tasks"]);
  assert.equal(result.exitCode, 2);
  const parsed = JSON.parse(result.stdout) as { status: string; errorCode: string };
  assert.equal(parsed.status, "failed");
  assert.equal(parsed.errorCode, "VALIDATION_ERROR");
});

test("missing note flags fail with JSON error before writing", async () => {
  const result = await run(["notes", "create"]);

  assert.equal(result.exitCode, 2);
  const parsed = JSON.parse(result.stdout) as { status: string; errorCode: string };
  assert.equal(parsed.status, "failed");
  assert.equal(parsed.errorCode, "VALIDATION_ERROR");
  assert.match(result.stderr, /edges notes --help/);
});

test("root without a subcommand is a usage error", async () => {
  const result = await run([]);

  assert.notEqual(result.exitCode, 0);
});

test("too-long title is rejected before writing", async () => {
  const result = await run(["notes", "create", "--title", "x".repeat(121), "--body", "body"]);

  assert.equal(result.exitCode, 2);
  const parsed = JSON.parse(result.stdout) as { errorCode: string };
  assert.equal(parsed.errorCode, "VALIDATION_ERROR");
});

test("note --help no longer documents EDGES_SCRIPT", async () => {
  const result = await run(["notes", "--help"]);
  assert.equal(result.exitCode, 0);
  assert.doesNotMatch(result.stdout, /EDGES_SCRIPT/);
  assert.doesNotMatch(result.stdout, /bin\/new-note/);
});
