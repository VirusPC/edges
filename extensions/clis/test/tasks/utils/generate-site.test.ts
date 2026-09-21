import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { run } from "../../../src/program.js";
import { generateTasksSite } from "../../../src/tasks/utils/generate-site.js";

test("generateTasksSite writes HTML with review payload and created title", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-site-"));
  try {
    const env = { ...process.env, EDGES_REPO: repo };
    const created = await run(["tasks", "create", "--title", "Board Alpha", "--status", "todo"], { env });
    assert.equal(created.exitCode, 0);
    const outPath = path.join(repo, "knowledge/tasks/_site/index.html");
    const result = await generateTasksSite({ repoPath: repo, outPath, env });
    assert.equal(result.path, path.resolve(outPath));
    assert.ok(result.groupCount >= 1);
    assert.ok(result.itemCount >= 1);
    const html = await readFile(outPath, "utf8");
    assert.match(html, /edges-review-payload/);
    assert.match(html, /Board Alpha/);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});
