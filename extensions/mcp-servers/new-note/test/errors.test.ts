import test from "node:test";
import assert from "node:assert/strict";
import { classifyError, summarize } from "../src/errors.js";

test("classifyError detects auth failures", () => {
  const code = classifyError({ stderr: "Permission denied (publickey)." });
  assert.equal(code, "PUSH_AUTH_FAILED");
});

test("classifyError maps missing CLI entry to SCRIPT_NOT_FOUND", () => {
  assert.equal(classifyError({ code: "ENOENT", message: "spawn ENOENT" }), "SCRIPT_NOT_FOUND");
  assert.equal(classifyError({ code: "ERR_MODULE_NOT_FOUND" }), "SCRIPT_NOT_FOUND");
  assert.equal(
    classifyError({ message: "ENOENT: no such file or directory, edges cli entry" }),
    "SCRIPT_NOT_FOUND",
  );
  assert.equal(
    classifyError({ stderr: "Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/repo/extensions/clis/dist/index.js'" }),
    "SCRIPT_NOT_FOUND",
  );
});

test("summarize returns shortened text", () => {
  const text = "a".repeat(600);
  const summary = summarize(text, 20);
  assert.equal(summary, "aaaaaaaaaaaaaaaaaaaa...");
});
