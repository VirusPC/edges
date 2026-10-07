import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { promises as fs } from "node:fs";
import { run } from "../../src/program.js";

test("notes create writes a local leaf without a git repository", async () => {
  const repo = await fs.mkdtemp(path.join(os.tmpdir(), "edges-cli-note-"));
  await fs.writeFile(path.join(repo, "AGENTS.md"), "# Scope\n\n<!-- project-harness-local:start -->\n## 本层系统维护信息\n\n<!-- project-harness-local:end -->\n");
  const result = await run(
    [
      "--scope",
      repo,
      "notes",
      "create",
      "--title",
      "Cli Isolated Note",
      "--body",
      "Throwaway note.",
    ],
    { env: {} },
  );

  assert.equal(result.exitCode, 0, result.stderr || result.stdout);
  const parsed = JSON.parse(result.stdout) as { status: string; path: string; command: string };
  assert.equal(parsed.status, "success");
  assert.equal(parsed.command, "notes.create");
  assert.match(parsed.path, /^notes\/\d{4}-\d{2}-\d{2}--cli-isolated-note\/INDEX\.md$/);
  await fs.access(path.join(repo, parsed.path));
  assert.equal(await fs.stat(path.join(repo, ".git")).then(() => true, () => false), false);
});
