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
