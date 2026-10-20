import test from "node:test";
import assert from "node:assert/strict";
import { runIngest } from "../src/service.js";
import type { RuntimeConfig } from "../src/types.js";

const config: RuntimeConfig = {
  repoPath: "/repo",
  baseBranch: "main",
  cliEntry: "/repo/extensions/cli/dist/index.js",
  skillsPath: "/repo/extensions/skills",
  mode: "direct",
  dryRun: false,
};

test("runIngest returns success payload", async () => {
  const result = await runIngest(
    {
      title: "Title",
      body: "Body",
    },
    config,
    async () => ({
      path: "notes/2026-02-18--title/INDEX.md",
      title: "Title",
      stdout: "done",
    }),
  );

  assert.equal(result.status, "success");
  if (result.status === "success") {
    assert.equal(result.path, "notes/2026-02-18--title/INDEX.md");
    assert.equal(result.title, "Title");
  }
});

test("runIngest returns failure payload", async () => {
  const result = await runIngest(
    {
      title: "Title",
      body: "Body",
    },
    config,
    async () => {
      const error = new Error("Permission denied (publickey).") as Error & { stderr?: string };
      error.stderr = "Permission denied (publickey).";
      throw error;
    },
  );

  assert.equal(result.status, "failed");
  if (result.status === "failed") {
    assert.equal(result.errorCode, "PUSH_AUTH_FAILED");
  }
});
