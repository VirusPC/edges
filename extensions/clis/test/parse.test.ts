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
