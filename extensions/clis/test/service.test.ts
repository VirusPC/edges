import test from "node:test";
import assert from "node:assert/strict";
import { runIngest } from "../src/service.js";
import type { RuntimeConfig } from "../src/types.js";

const config: RuntimeConfig = {
  repoPath: "/repo",
  baseBranch: "main",
  mode: "direct",
  dryRun: true,
};

test("runIngest returns success payload", async () => {
  const result = await runIngest(
    {
      title: "Title",
      content: "Body",
      coAuthor: "OpenAI Codex <codex@openai.com>",
    },
    config,
    async () => ({
      filePath: "knowledge/notes/2026-02-18--title.md",
      branch: "ingest/2026-02-18-title",
      prStatus: "created",
      prUrl: "https://github.com/org/repo/pull/1",
      stdout: "done\n__EDGES_FILE__=knowledge/notes/2026-02-18--title.md\n",
    }),
  );

  assert.equal(result.status, "success");
  if (result.status === "success") {
    assert.equal(result.branch, "ingest/2026-02-18-title");
    assert.equal(result.filePath, "knowledge/notes/2026-02-18--title.md");
    assert.equal(result.prStatus, "created");
  }
});

test("runIngest returns failure payload with errorCode", async () => {
  const result = await runIngest(
    {
      title: "Title",
      content: "Body",
      coAuthor: "OpenAI Codex <codex@openai.com>",
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
