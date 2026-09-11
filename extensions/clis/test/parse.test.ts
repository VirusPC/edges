import test from "node:test";
import assert from "node:assert/strict";
import { parseArgv } from "../src/parse.js";

const requiredNoteFlags = [
  "--title",
  "Daily summary",
  "--content",
  "Some useful content",
  "--co-author",
  "OpenAI Codex <codex@openai.com>",
] as const;

test("parseArgv accepts valid note flags", () => {
  const parsed = parseArgv(["note", ...requiredNoteFlags, "--json"]);

  assert.equal(parsed.kind, "note");
  if (parsed.kind === "note") {
    assert.equal(parsed.title, "Daily summary");
    assert.equal(parsed.content, "Some useful content");
    assert.equal(parsed.coAuthor, "OpenAI Codex <codex@openai.com>");
  }
});

test("parseArgv note rejects missing required flags", () => {
  const parsed = parseArgv(["note", "--title", "Daily summary"]);
  assert.equal(parsed.kind, "error");
  if (parsed.kind === "error") {
    assert.equal(parsed.errorCode, "VALIDATION_ERROR");
    assert.match(parsed.reason, /--content/);
    assert.match(parsed.reason, /--co-author/);
  }
});

test("parseArgv note rejects unknown flags", () => {
  const parsed = parseArgv(["note", ...requiredNoteFlags, "--nope"]);
  assert.equal(parsed.kind, "error");
  if (parsed.kind === "error") {
    assert.equal(parsed.errorCode, "VALIDATION_ERROR");
  }
});

test("parseArgv returns help for --help", () => {
  const parsed = parseArgv(["--help"]);
  assert.equal(parsed.kind, "help");
});

test("parseArgv note --help is help, not a validation error", () => {
  const parsed = parseArgv(["note", "--help"]);
  assert.equal(parsed.kind, "help");
});

test("parseArgv tasks --help is help", () => {
  const parsed = parseArgv(["tasks", "--help"]);
  assert.equal(parsed.kind, "help");
});

test("parseArgv tasks without flags is the placeholder command", () => {
  const parsed = parseArgv(["tasks"]);
  assert.equal(parsed.kind, "tasks");
});

test("parseArgv rejects unexpected positionals on note", () => {
  const parsed = parseArgv(["note", ...requiredNoteFlags, "leftover"]);
  assert.equal(parsed.kind, "error");
  if (parsed.kind === "error") {
    assert.equal(parsed.errorCode, "VALIDATION_ERROR");
  }
});

test("parseArgv note rejects --token-file together with --token-stdin", () => {
  const parsed = parseArgv([
    "note",
    ...requiredNoteFlags,
    "--token-file",
    "/tmp/token",
    "--token-stdin",
  ]);
  assert.equal(parsed.kind, "error");
  if (parsed.kind === "error") {
    assert.equal(parsed.errorCode, "VALIDATION_ERROR");
    assert.match(parsed.reason, /token-file|token-stdin/);
  }
});

test("parseArgv note rejects invalid --mode", () => {
  const parsed = parseArgv(["note", ...requiredNoteFlags, "--mode", "merge"]);
  assert.equal(parsed.kind, "error");
  if (parsed.kind === "error") {
    assert.equal(parsed.errorCode, "VALIDATION_ERROR");
    assert.match(parsed.reason, /mode/);
  }
});

test("parseArgv returns version", () => {
  assert.equal(parseArgv(["--version"]).kind, "version");
  assert.equal(parseArgv(["-v"]).kind, "version");
});

test("parseArgv root without a subcommand is not note ingest", () => {
  const parsed = parseArgv([]);
  assert.notEqual(parsed.kind, "note");
  assert.ok(parsed.kind === "help" || parsed.kind === "error");
});

test("parseArgv rejects the removed ingest subcommand name", () => {
  const parsed = parseArgv(["ingest", ...requiredNoteFlags]);
  assert.equal(parsed.kind, "error");
  if (parsed.kind === "error") {
    assert.equal(parsed.errorCode, "VALIDATION_ERROR");
  }
});

test("parseArgv rejects old root-as-ingest flat flags", () => {
  const parsed = parseArgv([...requiredNoteFlags, "--json"]);
  assert.notEqual(parsed.kind, "note");
  assert.equal(parsed.kind, "error");
});
