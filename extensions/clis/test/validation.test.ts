import test from "node:test";
import assert from "node:assert/strict";
import { validateInput } from "../src/validation.js";

test("validateInput accepts valid payload", () => {
  const parsed = validateInput({
    title: "Daily summary",
    content: "Some useful content",
    coAuthor: "OpenAI Codex <codex@openai.com>",
  });

  assert.equal(parsed.title, "Daily summary");
});

test("validateInput rejects missing field", () => {
  assert.throws(() => {
    validateInput({
      title: "Daily summary",
      content: "Some useful content",
    });
  });
});

test("validateInput rejects too-long title before git", () => {
  assert.throws(() => {
    validateInput({
      title: "x".repeat(121),
      content: "body",
      coAuthor: "OpenAI Codex <codex@openai.com>",
    });
  });
});
