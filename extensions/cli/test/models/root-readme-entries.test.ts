import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { ReadmeNode } from "../../src/domain/models/index.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../../..");
const rootReadme = join(repoRoot, "README.md");

test("repo root README project-entries-local includes domain tasks board", () => {
  const node = new ReadmeNode(rootReadme).parse(readFileSync(rootReadme, "utf8"));
  const ids = node.localChildren.map((c) => c.id);
  // Domain board is registered on the content face (README), not as an AGENTS child.
  assert.ok(ids.some((id) => id.endsWith("/tasks/README.md")));
  assert.ok(ids.some((id) => id.endsWith("/notes/README.md")));
});
