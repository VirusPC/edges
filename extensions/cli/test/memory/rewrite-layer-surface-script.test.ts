import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { planLayerMarkerRewrite } from "../../../../scripts/rewrite-project-harness-markers.mts";

function fixture(
  t: { after(fn: () => void): void },
  files: Record<string, string>,
) {
  const root = fs.mkdtempSync(
    path.join(fs.realpathSync(tmpdir()), "harness-markers-"),
  );
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const [rel, source] of Object.entries(files)) {
    const file = path.join(root, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, source);
  }
  return root;
}

const legacyLayer = `# T

<!-- project-memory:start -->
<!-- project-memory-important:start -->
## 本层重要约束

- Keep.
<!-- project-memory-important:end -->
<!-- project-memory-local:start -->
## 本层记忆

- [A](a/AGENTS.md)
<!-- project-memory-local:end -->
<!-- project-memory-children:start -->
## 下层作用域

- [B](b/AGENTS.md)
<!-- project-memory-children:end -->
<!-- project-memory:end -->
`;

const typeIndex = `<!-- project-memory-type:start -->
name: project
module: memory
writable: true
gitignore: false
format: ordinary
<!-- project-memory-type:end -->
# PROJECT
<!-- project-memory-entries:start -->
- [x](project_x/index.md) — x
<!-- project-memory-entries:end -->
`;

const modernLayer = `# T

<!-- project-harness:start -->
<!-- project-harness-constraints:start -->
## 本层硬约束

- Keep.
<!-- project-harness-constraints:end -->
<!-- project-harness:end -->
`;

test("plan rewrites layer entries and skips type indexes", (t) => {
  const root = fixture(t, {
    "AGENTS.md": legacyLayer,
    ".harness/memory/projects/AGENTS.md": typeIndex,
    "notes/AGENTS.md": modernLayer,
  });
  const plan = planLayerMarkerRewrite(root);
  assert.deepEqual(
    plan.edits.map((edit) => path.relative(root, edit.path)).sort(),
    ["AGENTS.md"],
  );
  assert.match(plan.edits[0]!.after, /<!-- project-harness:start -->/);
  assert.match(plan.edits[0]!.after, /## 本层系统维护信息/);
  assert.doesNotMatch(plan.edits[0]!.after, /project-memory-important/);
  assert.equal(planLayerMarkerRewrite(root).edits.length, 1);
});

test("plan is empty when every layer file is already canonical", (t) => {
  const root = fixture(t, {
    "AGENTS.md": modernLayer,
    ".harness/memory/projects/AGENTS.md": typeIndex,
  });
  assert.equal(planLayerMarkerRewrite(root).edits.length, 0);
});

test("plan skips posts and nested git boundaries", (t) => {
  const root = fixture(t, {
    "AGENTS.md": modernLayer,
    "posts/AGENTS.md": legacyLayer,
    "nested/AGENTS.md": legacyLayer,
  });
  fs.mkdirSync(path.join(root, "nested", ".git"));
  const plan = planLayerMarkerRewrite(root);
  assert.equal(plan.edits.length, 0);
});

test("plan rejects unpaired layer markers", (t) => {
  const root = fixture(t, {
    "AGENTS.md": "<!-- project-memory:start -->\n",
  });
  assert.throws(() => planLayerMarkerRewrite(root), /malformed|duplicate|marker/i);
});
