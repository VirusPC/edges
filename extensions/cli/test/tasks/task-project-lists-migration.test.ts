import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import {
  applyTaskProjectLists,
  planTaskProjectLists,
} from "../../../../scripts/migrate-task-project-lists.mts";
import { AgentsNode, ReadmeNode } from "../../src/domain/models/index.js";

function fixture(t: { after(fn: () => void): void }, files: Record<string, string>) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(tmpdir()), "task-project-lists-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const [rel, source] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), source);
  }
  return root;
}
const read = (root: string, rel: string) => fs.readFileSync(path.join(root, rel), "utf8");
const board = (local: string) =>
  `# tasks\n\n<!-- project-harness-constraints:start -->\n## 本层硬约束\n\nKeep.\n<!-- project-harness-constraints:end -->\n\n<!-- project-harness-local:start -->\n## 本层系统维护信息\n${local}<!-- project-harness-local:end -->\n`;
const project = (title: string) => `# ${title}\n\n${title} work.\n\n<!-- project-entries-local:start -->\n## 本层内容\n<!-- project-entries-local:end -->\n`;

test("moves README Task Project links (incl. legacy task-projects) into board README; keeps AGENTS projects; idempotent", async (t) => {
  const root = fixture(t, {
    "tasks/AGENTS.md": board(
      "<!-- task-projects:start -->\nCLI-maintained index of Task Project titles and descriptions. Do not hand-edit this section.\n\n- [`alpha`](alpha/README.md) — alpha work\n<!-- task-projects:end -->\n",
    ),
    "tasks/alpha/README.md": project("Alpha"),
    ".harness/tasks/AGENTS.md": board(
      "\n- [Memory](.harness/memory/projects/README.md) — memory\n- [Beta](beta/README.md) — beta work\n- [Gamma](gamma/AGENTS.md) — gamma work\n",
    ),
    ".harness/tasks/README.md": "# Board\n\nProse stays.\n",
    ".harness/tasks/beta/README.md": project("Beta"),
    ".harness/tasks/gamma/AGENTS.md": board(""),
  });
  const plan = planTaskProjectLists(root);
  assert.deepEqual(plan.conflicts, []);
  assert.deepEqual(
    plan.boards.map((b) => [path.relative(root, b.board), b.moved.map((id) => path.relative(root, id))]),
    [[".harness/tasks", [".harness/tasks/beta/README.md"]], ["tasks", ["tasks/alpha/README.md"]]],
  );
  await applyTaskProjectLists(plan);

  const domain = read(root, "tasks/AGENTS.md");
  assert.doesNotMatch(domain, /task-projects|alpha/);
  assert.match(domain, /## 本层系统维护信息\n\n<!-- project-harness-local:end -->/);
  const domainList = new ReadmeNode(path.join(root, "tasks/README.md")).parse(read(root, "tasks/README.md"));
  assert.deepEqual(domainList.localChildren.map((ref) => [path.relative(root, ref.id), ref.description]), [["tasks/alpha/README.md", "alpha work"]]);

  const maintenance = new AgentsNode(path.join(root, ".harness/tasks/AGENTS.md")).parse(read(root, ".harness/tasks/AGENTS.md"));
  assert.deepEqual(maintenance.localChildren.map((ref) => path.basename(path.dirname(ref.id))), ["projects", "gamma"]);
  const list = read(root, ".harness/tasks/README.md");
  assert.match(list, /^# Board\n\nProse stays\.\n/);
  assert.match(list, /\[Beta\]\(<beta\/README\.md>\) — beta work/);

  const snapshot = [read(root, "tasks/AGENTS.md"), read(root, ".harness/tasks/AGENTS.md"), list];
  assert.deepEqual(planTaskProjectLists(root).boards, []);
  assert.deepEqual([read(root, "tasks/AGENTS.md"), read(root, ".harness/tasks/AGENTS.md"), read(root, ".harness/tasks/README.md")], snapshot);
});

test("a board README listing the same project with different text is a conflict and nothing is written", async (t) => {
  const root = fixture(t, {
    "tasks/AGENTS.md": board("\n- [Alpha](alpha/README.md) — alpha work\n"),
    "tasks/README.md": "# Tasks\n\n<!-- project-entries-local:start -->\n## 本层内容\n\n- [Alpha](alpha/README.md) — other text\n<!-- project-entries-local:end -->\n",
    "tasks/alpha/README.md": project("Alpha"),
  });
  const before = read(root, "tasks/AGENTS.md");
  const plan = planTaskProjectLists(root);
  assert.equal(plan.conflicts.length, 1);
  await assert.rejects(applyTaskProjectLists(plan), /Conflicts block apply/);
  assert.equal(read(root, "tasks/AGENTS.md"), before);
});
