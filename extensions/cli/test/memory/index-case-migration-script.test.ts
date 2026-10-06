import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import {
  applyIndexCaseMigration,
  planIndexCaseMigration,
  reachableNodes,
} from "../../../../scripts/migrate-index-to-INDEX.mts";

function fixture(
  t: { after(fn: () => void): void },
  files: Record<string, string>,
) {
  const root = fs.mkdtempSync(
    path.join(fs.realpathSync(tmpdir()), "index-case-migrate-"),
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
const names = (root: string, rel: string) =>
  fs.readdirSync(path.join(root, rel)).sort();

const rootAgents = `# Root

<!-- project-harness-local:start -->
## 本层系统维护信息
- [guide](<guide/AGENTS.md>) — g
<!-- project-harness-local:end -->
`;
const guideAgents = `# Guide

<!-- project-harness-local:start -->
## 本层系统维护信息
- [Alpha 笔记](<notes/alpha 一/index.md#top>) — alpha
- [Beta](notes/beta/index.md) — beta
<!-- project-harness-local:end -->
`;
const note = (name: string, body = "") =>
  `---\nname: ${name}\ndescription: ${name}\nmetadata:\n  edges-type: note\n---\n${body}\n`;

const base = (): Record<string, string> => ({
  "AGENTS.md": rootAgents,
  "guide/AGENTS.md": guideAgents,
  "guide/notes/alpha 一/index.md": note("alpha", "See [beta](../beta/index.md#x).\n"),
  "guide/notes/beta/index.md": note("beta", "Self [me](index.md).\n"),
  "guide/loose/index.md": "# Unregistered\n\nPlain leaf.\n",
  "posts/2026-a/index.md":
    "# Public post\n\nLink [note](../../guide/notes/beta/index.md) stays.\n",
  "docs/ref.md": "[beta](../guide/notes/beta/index.md) and [x](https://e.test/index.md)\n",
});

test("dry-run plans every leaf rename (posts included) without touching disk", (t) => {
  const root = fixture(t, base());
  const plan = planIndexCaseMigration(root);
  assert.deepEqual(
    plan.renames.map((r) => path.relative(root, r.from)).sort(),
    [
      "guide/loose/index.md",
      "guide/notes/alpha 一/index.md",
      "guide/notes/beta/index.md",
      "posts/2026-a/index.md",
    ],
  );
  assert.deepEqual(plan.conflicts, []);
  assert.equal(plan.renames.find((r) => r.from.includes("posts"))?.protected, true);
  assert.ok(
    plan.linkEdits.every((e) => !path.relative(root, e.path).startsWith("posts")),
  );
  assert.deepEqual(
    plan.protectedLinkWarnings.map((w) => path.relative(root, w)),
    ["posts/2026-a/index.md"],
  );
  assert.deepEqual(names(root, "guide/notes/beta"), ["index.md"]);
});

test("apply renames, rewrites registrations and body links, and posts only rename", async (t) => {
  const root = fixture(t, base());
  const postsBefore = read(root, "posts/2026-a/index.md");
  await applyIndexCaseMigration(planIndexCaseMigration(root));

  assert.deepEqual(names(root, "guide/notes/beta"), ["INDEX.md"]);
  assert.deepEqual(names(root, "guide/loose"), ["INDEX.md"]);
  assert.deepEqual(names(root, "posts/2026-a"), ["INDEX.md"]);
  assert.equal(read(root, "posts/2026-a/INDEX.md"), postsBefore);

  const agents = read(root, "guide/AGENTS.md");
  assert.match(agents, /\(<notes\/alpha 一\/INDEX\.md#top>\)/);
  assert.match(agents, /\(notes\/beta\/INDEX\.md\)/);
  assert.match(read(root, "guide/notes/alpha 一/INDEX.md"), /\(\.\.\/beta\/INDEX\.md#x\)/);
  assert.match(read(root, "guide/notes/beta/INDEX.md"), /\[me\]\(INDEX\.md\)/);
  assert.match(read(root, "docs/ref.md"), /\.\.\/guide\/notes\/beta\/INDEX\.md\) and \[x\]\(https:\/\/e\.test\/index\.md\)/);

  const reached = await reachableNodes(root);
  assert.ok(reached.has(path.join(root, "guide/notes/beta/INDEX.md")));
  assert.ok(reached.has(path.join(root, "guide/notes/alpha 一/INDEX.md")));
  assert.ok(!reached.has(path.join(root, "guide/notes/beta/index.md")));
});

test("apply is idempotent", async (t) => {
  const root = fixture(t, base());
  await applyIndexCaseMigration(planIndexCaseMigration(root));
  const again = planIndexCaseMigration(root);
  assert.deepEqual(again.renames, []);
  assert.deepEqual(again.linkEdits, []);
  assert.deepEqual(again.conflicts, []);
  await applyIndexCaseMigration(again);
});

test("a sibling INDEX.md is a conflict and nothing is changed", async (t) => {
  const files = base();
  files["guide/notes/beta/INDEX.md"] = "# other\n";
  const root = fixture(t, files);
  const plan = planIndexCaseMigration(root);
  assert.equal(plan.conflicts.length, 1);
  assert.match(plan.conflicts[0]!, /guide\/notes\/beta/);
  await assert.rejects(() => applyIndexCaseMigration(plan), /Conflicts/);
  assert.deepEqual(names(root, "guide/notes/beta").sort(), ["INDEX.md", "index.md"]);
  assert.match(read(root, "guide/AGENTS.md"), /notes\/beta\/index\.md/);
});

test("symlinks, git boundaries and non-leaf names are left alone", (t) => {
  const root = fixture(t, {
    ...base(),
    "vendor/.git/HEAD": "ref\n",
    "vendor/x/index.md": "# nested repo\n",
    "guide/Index.md": "# other spelling\n",
  });
  const plan = planIndexCaseMigration(root);
  const rels = plan.renames.map((r) => path.relative(root, r.from));
  assert.ok(!rels.some((r) => r.startsWith("vendor")));
  assert.ok(!rels.includes("guide/Index.md"));
});

test("traversal classifies registered and unregistered leaves", async (t) => {
  const root = fixture(t, base());
  const plan = planIndexCaseMigration(root, await reachableNodes(root));
  const flag = (suffix: string) =>
    plan.renames.find((r) => r.from.endsWith(suffix))?.registered;
  assert.equal(flag("notes/beta/index.md"), true);
  assert.equal(flag("alpha 一/index.md"), true);
  assert.equal(flag("loose/index.md"), false);
});
