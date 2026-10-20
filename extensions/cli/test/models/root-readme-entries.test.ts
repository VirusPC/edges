import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { ReadmeNode } from "../../src/domain/models/index.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../../..");
const rootReadme = join(repoRoot, "README.md");

test("repo root README project-entries-local lists posts and no personal content dirs", () => {
  const node = new ReadmeNode(rootReadme).parse(readFileSync(rootReadme, "utf8"));
  const ids = node.localChildren.map((c) => c.id);
  assert.ok(ids.some((id) => id.endsWith("/posts/README.md")));
  // Personal content (tasks/, notes/, ...) moved to VirusPC/edges-brain-viruspc on 2026-10-20.
  for (const dir of ["tasks", "notes", "memory", "retrospectives", "teaching", "edges"]) {
    assert.equal(ids.some((id) => id.endsWith(`/${dir}/README.md`)), false, dir);
  }
});
