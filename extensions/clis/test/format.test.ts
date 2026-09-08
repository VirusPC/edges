import test from "node:test";
import assert from "node:assert/strict";
import { formatResult } from "../src/format.js";

test("formatted success includes file path, branch, and pr status", () => {
  const json = formatResult({
    status: "success",
    filePath: "knowledge/notes/2026-09-07--title.md",
    branch: "main",
    prStatus: "direct_commit",
    stdoutSummary: "done",
    diagnostics: "human progress should stay off stdout",
  });
  const parsed = JSON.parse(json) as {
    status: string;
    filePath: string;
    branch: string;
    prStatus: string;
    diagnostics?: string;
  };

  assert.equal(parsed.status, "success");
  assert.equal(parsed.filePath, "knowledge/notes/2026-09-07--title.md");
  assert.equal(parsed.branch, "main");
  assert.equal(parsed.prStatus, "direct_commit");
  assert.equal(parsed.diagnostics, undefined);
});

test("formatted failure includes errorCode", () => {
  const json = formatResult({
    status: "failed",
    errorCode: "VALIDATION_ERROR",
    reason: "missing required flags: --title",
  });
  const parsed = JSON.parse(json) as { status: string; errorCode: string };

  assert.equal(parsed.status, "failed");
  assert.equal(parsed.errorCode, "VALIDATION_ERROR");
});
