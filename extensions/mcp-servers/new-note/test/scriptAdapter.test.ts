import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { promises as fs } from "node:fs";
import { runIngestScript } from "../src/scriptAdapter.js";
import type { RuntimeConfig } from "../src/types.js";

test("runIngestScript parses marker output", async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "edges-ingest-test-"));
  const scriptPath = path.join(tmpDir, "mock-ingest.sh");

  await fs.writeFile(
    scriptPath,
    "#!/usr/bin/env bash\n" +
      "echo \"__EDGES_FILE__=inbox/2026-02-18--demo.md\"\n" +
      "echo \"__EDGES_BRANCH__=ingest/2026-02-18-demo\"\n" +
      "echo \"__EDGES_PR_STATUS__=created\"\n" +
      "echo \"__EDGES_PR_URL__=https://github.com/org/repo/pull/9\"\n",
    { mode: 0o755 },
  );

  const config: RuntimeConfig = {
    repoPath: "/repo",
    baseBranch: "main",
    scriptPath,
  };

  const result = await runIngestScript(
    {
      title: "Demo",
      content: "Body",
      coAuthor: "OpenAI Codex <codex@openai.com>",
    },
    config,
  );

  assert.equal(result.filePath, "inbox/2026-02-18--demo.md");
  assert.equal(result.branch, "ingest/2026-02-18-demo");
  assert.equal(result.prStatus, "created");
});
