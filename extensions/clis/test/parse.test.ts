import test from "node:test";
import assert from "node:assert/strict";
import { parseArgv } from "../src/parse.js";

test("parseArgv accepts valid flags", () => {
  const parsed = parseArgv([
    "--title",
    "Daily summary",
    "--content",
    "Some useful content",
    "--co-author",
    "OpenAI Codex <codex@openai.com>",
    "--json",
  ]);

  assert.equal(parsed.kind, "ingest");
  if (parsed.kind === "ingest") {
    assert.equal(parsed.title, "Daily summary");
    assert.equal(parsed.content, "Some useful content");
    assert.equal(parsed.coAuthor, "OpenAI Codex <codex@openai.com>");
  }
});

test("parseArgv rejects missing required flags", () => {
  const parsed = parseArgv(["--title", "Daily summary"]);
  assert.equal(parsed.kind, "error");
  if (parsed.kind === "error") {
    assert.equal(parsed.errorCode, "VALIDATION_ERROR");
    assert.match(parsed.reason, /--content/);
    assert.match(parsed.reason, /--co-author/);
  }
});

test("parseArgv rejects unknown flags", () => {
  const parsed = parseArgv(["--title", "T", "--content", "C", "--co-author", "abc", "--nope"]);
  assert.equal(parsed.kind, "error");
  if (parsed.kind === "error") {
    assert.equal(parsed.errorCode, "VALIDATION_ERROR");
  }
});

test("parseArgv returns help", () => {
  const parsed = parseArgv(["--help"]);
  assert.equal(parsed.kind, "help");
});

test("parseArgv accepts the ingest subcommand with the same flags", () => {
  const parsed = parseArgv([
    "ingest",
    "--title",
    "Daily summary",
    "--content",
    "Some useful content",
    "--co-author",
    "OpenAI Codex <codex@openai.com>",
    "--json",
  ]);

  assert.equal(parsed.kind, "ingest");
  if (parsed.kind === "ingest") {
    assert.equal(parsed.title, "Daily summary");
    assert.equal(parsed.content, "Some useful content");
    assert.equal(parsed.coAuthor, "OpenAI Codex <codex@openai.com>");
    assert.equal(parsed.dryRun, false);
    assert.equal(parsed.tokenStdin, false);
  }
});

test("parseArgv keeps flags that appear before the ingest subcommand", () => {
  const parsed = parseArgv([
    "--dry-run",
    "--json",
    "ingest",
    "--title",
    "Daily summary",
    "--content",
    "Some useful content",
    "--co-author",
    "OpenAI Codex <codex@openai.com>",
    "--mode",
    "pr",
  ]);

  assert.equal(parsed.kind, "ingest");
  if (parsed.kind === "ingest") {
    assert.equal(parsed.dryRun, true);
    assert.equal(parsed.mode, "pr");
    assert.equal(parsed.title, "Daily summary");
  }
});

test("parseArgv ingest --help is help, not a positional error", () => {
  const parsed = parseArgv(["ingest", "--help"]);
  assert.equal(parsed.kind, "help");
});

test("parseArgv rejects unexpected positionals", () => {
  const parsed = parseArgv(["--title", "T", "--content", "C", "--co-author", "abc", "leftover"]);
  assert.equal(parsed.kind, "error");
  if (parsed.kind === "error") {
    assert.equal(parsed.errorCode, "VALIDATION_ERROR");
  }
});

test("parseArgv rejects --token-file together with --token-stdin", () => {
  const parsed = parseArgv([
    "--title",
    "T",
    "--content",
    "C",
    "--co-author",
    "abc",
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

test("parseArgv rejects invalid --mode", () => {
  const parsed = parseArgv([
    "--title",
    "T",
    "--content",
    "C",
    "--co-author",
    "abc",
    "--mode",
    "merge",
  ]);
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
