import test from "node:test";
import assert from "node:assert/strict";
import { validateInput } from "../src/validation.js";

test("validateInput accepts title and body", () => {
  const parsed = validateInput({
    title: "Daily summary",
    body: "Some useful content",
  });

  assert.equal(parsed.title, "Daily summary");
  assert.equal(parsed.body, "Some useful content");
});

test("validateInput rejects a missing title", () => {
  assert.throws(() => {
    validateInput({
      body: "Some useful content",
    });
  });
});
