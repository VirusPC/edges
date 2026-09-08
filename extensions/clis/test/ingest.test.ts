import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { promises as fs } from "node:fs";
import { execFile as execFileCb } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { run } from "../src/run.js";

const execFile = promisify(execFileCb);
const here = path.dirname(fileURLToPath(import.meta.url));
const edgesRoot = path.resolve(here, "../../..");
const scriptPath = path.join(edgesRoot, "bin/new-note");

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
        EDGES_SCRIPT: scriptPath,
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
  assert.ok(parsed.filePath);
  assert.ok(parsed.branch);
  assert.equal(parsed.prStatus, "direct_commit");

  const written = path.join(repo, parsed.filePath);
  await fs.access(written);
});
