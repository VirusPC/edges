import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { ReadmeNode } from "../../src/domain/models/index.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../../..");
const rootReadme = join(repoRoot, "README.md");

test("repo root README edges-entries-local lists no posts or personal content dirs", () => {
  const node = new ReadmeNode(rootReadme).parse(readFileSync(rootReadme, "utf8"));
  const ids = node.localChildren.map((c) => c.id);
  // posts/ and site-and-content left for the personal brain repo on 2026-10-20.
  assert.equal(ids.some((id) => id.endsWith("/posts/README.md")), false);
  for (const dir of ["tasks", "notes", "memory", "retrospectives", "teaching", "edges", "posts"]) {
    assert.equal(ids.some((id) => id.endsWith(`/${dir}/README.md`)), false, dir);
  }
});
