import test from "node:test";
import assert from "node:assert/strict";
import { classifyError, summarize } from "../src/errors.js";

test("classifyError detects auth failures", () => {
  const code = classifyError({ stderr: "Permission denied (publickey)." });
  assert.equal(code, "PUSH_AUTH_FAILED");
});

test("classifyError detects missing script via ENOENT", () => {
  const code = classifyError({ code: "ENOENT", message: "spawn bin/new-note ENOENT" });
  assert.equal(code, "SCRIPT_NOT_FOUND");
});

test("summarize returns shortened text", () => {
  const text = "a".repeat(600);
  const summary = summarize(text, 20);
  assert.equal(summary, "aaaaaaaaaaaaaaaaaaaa...");
});
