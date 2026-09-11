import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { promises as fs } from "node:fs";
import { execFile as execFileCb } from "node:child_process";
import { promisify } from "node:util";
import { run } from "../src/run.js";

const execFile = promisify(execFileCb);

async function initTempRepo(): Promise<string> {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "edges-cli-ingest-"));
  await execFile("git", ["init"], { cwd: tmp });
  await execFile("git", ["config", "user.email", "tester@example.com"], { cwd: tmp });
  await execFile("git", ["config", "user.name", "Tester"], { cwd: tmp });
  return tmp;
}

test("dry-run ingest against an isolated repo returns parseable success", async () => {
  const repo = await initTempRepo();
  const result = await run(
    [
      "note",
      "--title",
      "Cli Isolated Ingest",
      "--content",
      "Throwaway note for CLI ingest test.",
      "--co-author",
      "Tester <tester@example.com>",
      "--dry-run",
      "--json",
    ],
    {
      env: {
        ...process.env,
        EDGES_REPO: repo,
        EDGES_DRY_RUN: "true",
        EDGES_MODE: "direct",
        EDGES_AUTH_TOKEN: "",
      },
    },
  );

  assert.equal(result.exitCode, 0, result.stderr || result.stdout);
  const parsed = JSON.parse(result.stdout) as {
    status: string;
    filePath: string;
    branch: string;
    prStatus: string;
  };
  assert.equal(parsed.status, "success");
  assert.ok(parsed.filePath.startsWith("knowledge/notes/"));
  assert.equal(parsed.prStatus, "direct_commit");
  await fs.access(path.join(repo, parsed.filePath));
});
