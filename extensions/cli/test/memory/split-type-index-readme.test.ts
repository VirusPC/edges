import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import {
  applyTypeIndexSplit,
  convertTypeIndexSource,
  planTypeIndexSplit,
} from "../../../../scripts/split-type-index-readme.mts";

function fixture(
  t: { after(fn: () => void): void },
  files: Record<string, string>,
) {
  const root = fs.mkdtempSync(
    path.join(fs.realpathSync(tmpdir()), "split-type-index-"),
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

const typeIndex = `<!-- project-memory-type:start -->
name: project
module: memory
writable: true
gitignore: false
format: ordinary
<!-- project-memory-type:end -->

# PROJECT

> intro

<!-- project-harness-local:start -->
## 本层系统维护信息

- [x](project_x/INDEX.md) — x
<!-- project-harness-local:end -->
`;

const layer = `# Layer

<!-- project-harness-local:start -->
## 本层系统维护信息
- [project](<.harness/memory/projects/AGENTS.md>) — p
- [根维护任务](<.harness/tasks/AGENTS.md>) — board
- [领域任务](<tasks/AGENTS.md>) — domain
<!-- project-harness-local:end -->
`;

test("convertTypeIndexSource renames harness list markers to project-entries", () => {
  const out = convertTypeIndexSource(typeIndex);
  assert.match(out, /<!-- project-memory-type:start -->/);
  assert.match(out, /<!-- project-entries-local:start -->\n## 本层内容/);
  assert.match(out, /- \[x\]\(project_x\/INDEX\.md\) — x/);
  assert.doesNotMatch(out, /project-harness-local/);
  assert.doesNotMatch(out, /本层系统维护信息/);
});

const stub = `# MANAGED

<!-- project-harness:start -->

<!-- project-harness-constraints:start -->
## 本层硬约束

- 本目录有项目记忆。提问或动手前用 \`$project-memory-ask\`；该沉淀用 \`$project-memory-remember\`。本轮查过不重复。
<!-- project-harness-constraints:end -->

<!-- project-harness:end -->
`;

test("apply moves the type index to README and deletes memory and skills stubs", async (t) => {
  const root = fixture(t, {
    "AGENTS.md": layer,
    ".harness/memory/projects/AGENTS.md": typeIndex,
    ".harness/skills/managed/AGENTS.md": stub,
    ".harness/skills/managed/README.md": `<!-- project-memory-type:start -->
name: managed
module: skills
writable: true
gitignore: false
format: skills
<!-- project-memory-type:end -->

# MANAGED

<!-- project-entries-local:start -->
## 本层内容

- [method](method/SKILL.md) — method
<!-- project-entries-local:end -->
`,
    ".harness/tasks/AGENTS.md": "# tasks\n\n<!-- project-harness-constraints:start -->\n## 本层硬约束\n\n- keep\n<!-- project-harness-constraints:end -->\n",
    ".harness/tasks/README.md": "# tasks\n\n<!-- project-entries-local:start -->\n## 本层内容\n\n- [Default](<_default/README.md>)\n<!-- project-entries-local:end -->\n",
    "tasks/AGENTS.md":
      "# domain tasks\n\n<!-- project-harness-constraints:start -->\n## 本层硬约束\n\n共同看板约定见[维护看板](../.harness/tasks/AGENTS.md)。\n<!-- project-harness-constraints:end -->\n",
    "tasks/README.md": "# domain readme\n",
    "extensions/skills/project-memory-init/AGENTS.md": "# skill package\n",
    ".harness/memory/users/AGENTS.md": typeIndex.replace("name: project", "name: user"),
  });
  const plan = planTypeIndexSplit(root);
  assert.deepEqual(
    plan.migrations.map((m) => path.relative(root, m.from)),
    [".harness/memory/projects/AGENTS.md"],
  );
  assert.deepEqual(
    plan.deletions.map((d) => path.relative(root, d.path)),
    [".harness/skills/managed/AGENTS.md"],
  );
  assert.equal(plan.conflicts.length, 0);
  assert.ok(plan.skipped.some((s) => s.path.includes("users")));
  await applyTypeIndexSplit(plan);
  const readme = read(root, ".harness/memory/projects/README.md");
  assert.match(readme, /project-entries-local/);
  assert.match(readme, /project_x\/INDEX\.md/);
  assert.equal(fs.existsSync(path.join(root, ".harness/memory/projects/AGENTS.md")), false);
  assert.equal(fs.existsSync(path.join(root, ".harness/skills/managed/AGENTS.md")), false);
  assert.match(read(root, ".harness/skills/managed/README.md"), /project-memory-type/);
  const top = read(root, "AGENTS.md");
  assert.match(top, /\.harness\/memory\/projects\/README\.md/);
  assert.match(top, /\.harness\/tasks\/README\.md/);
  assert.match(top, /\]\(<tasks\/AGENTS\.md>\)/);
  assert.doesNotMatch(top, /\]\(<tasks\/README\.md>\)/);
  assert.match(read(root, ".harness/tasks/AGENTS.md"), /keep/);
  assert.match(read(root, "tasks/AGENTS.md"), /\.\.\/\.harness\/tasks\/AGENTS\.md/);
  assert.doesNotMatch(read(root, "tasks/AGENTS.md"), /\.\.\/\.harness\/tasks\/README\.md/);
  assert.equal(read(root, "extensions/skills/project-memory-init/AGENTS.md"), "# skill package\n");
  assert.match(read(root, ".harness/memory/users/AGENTS.md"), /name: user/);
  assert.match(read(root, ".harness/memory/users/AGENTS.md"), /project_x/);

  const again = planTypeIndexSplit(root);
  assert.equal(again.migrations.length, 0);
  assert.equal(again.deletions.length, 0);
  assert.equal(again.linkEdits.length, 0);
});
