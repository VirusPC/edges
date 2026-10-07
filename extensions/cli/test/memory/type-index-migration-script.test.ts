import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import {
  applyTypeIndexMigration,
  convertOrgList,
  convertTypeIndex,
  planTypeIndexMigration,
  retargetLinks,
} from "../../../../scripts/migrate-type-index-to-readme.mts";
import { ReadmeNode } from "../../src/domain/models/readme/readme-node.js";

function fixture(
  t: { after(fn: () => void): void },
  files: Record<string, string>,
) {
  const root = fs.mkdtempSync(
    path.join(fs.realpathSync(tmpdir()), "type-index-migrate-"),
  );
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const [rel, source] of Object.entries(files)) {
    const file = path.join(root, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, source);
  }
  return root;
}
const read = (root: string, rel: string) =>
  fs.readFileSync(path.join(root, rel), "utf8");
const exists = (root: string, rel: string) =>
  fs.existsSync(path.join(root, rel));

const typeIndex = `<!-- project-memory-type:start -->
name: project
module: memory
writable: true
gitignore: false
format: ordinary
<!-- project-memory-type:end -->

# PROJECT

> intro

<!-- project-memory-entries:start -->
- [x](project_x/index.md) — x
<!-- project-memory-entries:end -->
`;

const layer = `# Layer

<!-- project-harness-constraints:start -->
## 本层硬约束

- Keep.
<!-- project-harness-constraints:end -->

<!-- project-harness-local:start -->
## 本层系统维护信息
- [project](<.harness/memory/projects/AGENTS.md>) — p
- [Alpha](<alpha/AGENTS.md>) — alpha project
<!-- project-harness-local:end -->
`;

const orgList = `# Alpha

alpha project

<!-- project-harness-local:start -->
## 本层系统维护信息
- [one](<backlog/2026-01-01--one/index.md>) — one

- [two](<todo/2026-01-02--two/index.md>) — mentions .harness/memory in prose
<!-- project-harness-local:end -->
`;

test("convertTypeIndex keeps header and renames entries markers", () => {
  const out = convertTypeIndex(typeIndex);
  assert.match(out, /<!-- project-memory-type:start -->/);
  assert.match(
    out,
    /<!-- project-entries-local:start -->\n## 本层内容\n\n- \[x\]\(project_x\/index\.md\) — x\n<!-- project-entries-local:end -->/,
  );
  assert.doesNotMatch(out, /project-memory-entries/);
  assert.equal(convertTypeIndex(out), out);
});

test("convertOrgList moves composition to project-entries and drops empty constraints", () => {
  const out = convertOrgList(
    orgList.replace(
      "<!-- project-harness-local:start -->",
      "<!-- project-harness-constraints:start -->\n## 本层硬约束\n<!-- project-harness-constraints:end -->\n\n<!-- project-harness-local:start -->",
    ),
  );
  assert.doesNotMatch(out, /project-harness/);
  assert.match(out, /<!-- project-entries-local:start -->\n## 本层内容\n\n- \[one\]/);
  assert.doesNotMatch(out, /\n\n- \[two\]/);
  const node = new ReadmeNode(path.resolve("/tmp/x/alpha/README.md")).parse(out);
  assert.equal(node.localChildren.length, 2);
});

test("retargetLinks rewrites angled and plain links to moved AGENTS only", () => {
  const moved = new Map([["/r/a/AGENTS.md", "/r/a/README.md"]]);
  const src =
    "[a](<a/AGENTS.md>) [b](a/AGENTS.md) [c](b/AGENTS.md) [d](https://x/a/AGENTS.md) [a/AGENTS.md](a/AGENTS.md)";
  assert.equal(
    retargetLinks("/r/AGENTS.md", src, moved),
    "[a](<a/README.md>) [b](a/README.md) [c](b/AGENTS.md) [d](https://x/a/AGENTS.md) [a/README.md](a/README.md)",
  );
});

test("plan classifies type indexes, org lists and real system entries", (t) => {
  const root = fixture(t, {
    "AGENTS.md": layer,
    ".harness/memory/projects/AGENTS.md": typeIndex,
    "alpha/AGENTS.md": orgList,
    "alpha/backlog/2026-01-01--one/index.md": "# one\n",
    "beta/AGENTS.md":
      "# Beta\n\n<!-- project-harness-local:start -->\n## 本层系统维护信息\n- [m](<.harness/memory/projects/README.md>)\n- [l](<x/index.md>)\n<!-- project-harness-local:end -->\n",
    "beta/.harness/memory/projects/README.md": "# p\n",
    "gamma/AGENTS.md": "# Gamma\n\nplain agent prose, no list\n",
  });
  const plan = planTypeIndexMigration(root);
  assert.deepEqual(
    plan.migrations.map((m) => [m.kind, path.relative(root, m.from)]).sort(),
    [
      ["org-list", "alpha/AGENTS.md"],
      ["type-index", ".harness/memory/projects/AGENTS.md"],
    ],
  );
  assert.deepEqual(plan.skipped.map((s) => s.path).sort(), [
    "AGENTS.md",
    "beta/AGENTS.md",
  ]);
  assert.deepEqual(plan.conflicts, []);
  assert.deepEqual(
    plan.linkEdits.map((e) => path.relative(root, e.path)),
    ["AGENTS.md"],
  );
  assert.ok(exists(root, ".harness/memory/projects/AGENTS.md"), "dry-run");
});

test("apply writes README, deletes AGENTS, retargets links and is idempotent", async (t) => {
  const root = fixture(t, {
    "AGENTS.md": layer,
    ".harness/memory/projects/AGENTS.md": typeIndex,
    "alpha/AGENTS.md": orgList,
  });
  await applyTypeIndexMigration(planTypeIndexMigration(root));
  assert.equal(exists(root, ".harness/memory/projects/AGENTS.md"), false);
  assert.equal(exists(root, "alpha/AGENTS.md"), false);
  assert.match(read(root, ".harness/memory/projects/README.md"), /project-entries-local/);
  assert.match(read(root, "alpha/README.md"), /project-entries-local/);
  const top = read(root, "AGENTS.md");
  assert.match(top, /\]\(<\.harness\/memory\/projects\/README\.md>\)/);
  assert.match(top, /\]\(<alpha\/README\.md>\)/);
  assert.match(top, /Keep\./);

  const again = planTypeIndexMigration(root);
  assert.equal(again.migrations.length, 0);
  assert.equal(again.linkEdits.length, 0);
});

test("existing README next to a migrating AGENTS is a conflict and nothing is written", async (t) => {
  const root = fixture(t, {
    "alpha/AGENTS.md": orgList,
    "alpha/README.md": "# existing\n",
  });
  const plan = planTypeIndexMigration(root);
  assert.equal(plan.conflicts.length, 1);
  await assert.rejects(applyTypeIndexMigration(plan), /Conflicts/);
  assert.ok(exists(root, "alpha/AGENTS.md"));
});

test("private user memory type indexes are never migrated", (t) => {
  const root = fixture(t, {
    ".harness/memory/users/AGENTS.md": typeIndex.replace("project", "user"),
  });
  const plan = planTypeIndexMigration(root);
  assert.equal(plan.migrations.length, 0);
  assert.equal(plan.skipped.length, 1);
});
