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

test("validateInput retains material selection and rejects invalid field types", () => {
  assert.deepEqual(validateInput({ title: "Note", project: "P/projects/Q", super: true }), {
    title: "Note", body: "", project: "P/projects/Q", super: true,
  });
  for (const fields of [{ project: "" }, { project: 1 }, { super: "true" }]) {
    assert.throws(() => validateInput({ title: "Note", ...fields }));
  }
});
