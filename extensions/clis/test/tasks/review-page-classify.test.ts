import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { run } from "../../src/program.js";

const classify = {
  groups: [
    { id: "default", title: "Default", description: "ungrouped" },
    { id: "cli", title: "CLI", description: "edges CLI" },
  ],
  items: [
    { stem: "2026-09-13--demo", current: "default", suggested: "cli", title: "Demo", description: "demo task" },
    {
      stem: "2026-09-13--thin",
      current: "default",
      suggested: "default",
      title: "Thin",
      doc: { name: "thin", description: "thin", metadata: { "edges-task-assignee": "Ada" }, body: "" },
    },
  ],
};

test("review-page renders classify JSON with a missing doc and a thin doc", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "edges-classify-"));
  try {
    const out = path.join(dir, "out.html");
    const result = await run(["tasks", "project", "review-page", "--from", "-", "--out", out], {
      stdinText: JSON.stringify(classify),
    });
    assert.equal(result.exitCode, 0, result.stderr);
    const html = await readFile(out, "utf8");
    assert.match(html, /id="edges-review-payload"/);
    assert.match(html, /2026-09-13--demo/);
    assert.match(html, /2026-09-13--thin/);
    assert.match(html, /<script type="module">/);
    assert.doesNotMatch(html, /src="\.\/review\.js"/);
    assert.doesNotMatch(html, /playwrightReportBase64/);
    assert.match(html, /edges-task-assignee/);
    const body = JSON.parse(result.stdout) as { command: string; path: string };
    assert.equal(body.command, "project.review-page");
    assert.equal(body.path, out);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
