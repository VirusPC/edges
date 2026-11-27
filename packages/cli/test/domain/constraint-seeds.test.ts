import assert from "node:assert/strict";
import test from "node:test";
import { CONSTRAINT_SEED_PREAMBLE } from "../../src/domain/config/constraint-seeds.js";
import { getInitializedConstraintTypes } from "../../src/domain/operations/constraint-seeds.js";
import { AgentsNode } from "../../src/domain/models/agents/agents-node.js";
import { CONSTRAINTS_END, CONSTRAINTS_START } from "../../src/domain/config/sections.js";

const markers = (id: string) => `<!-- edges-seed:${id} -->`;
const section = (inner: string, heading = "## 本层硬约束") =>
  `${CONSTRAINTS_START}\n${heading}\n${inner}${CONSTRAINTS_END}`;
const nodeWith = (inner: string, heading?: string) =>
  new AgentsNode("/scope/AGENTS.md").parse(section(inner, heading));

test("registers the six constraint types in official order from indexed paths", () => {
  assert.deepEqual(
    getInitializedConstraintTypes([
      "/scope/.edges/skills/referenced/README.md",
      "/scope/.edges/memory/custom/README.md",
      "/scope/.edges/tasks/README.md",
      "/scope/.edges/memory/users/README.md",
      "/scope/.edges/routines/README.md",
      "/scope/.edges/projects/README.md",
      "/scope/.edges/evaluation/README.md",
      "/scope/.edges/notes/README.md",
    ], "/scope/.edges"),
    ["memory", "notes", "skills", "tasks", "routines", "projects"],
  );
  assert.deepEqual(
    getInitializedConstraintTypes(["/scope/.edges/memory", "/scope/.edges/memoryish/README.md"], "/scope/.edges"),
    [],
  );
});

test("inserts missing seeds after the previous registered seed in type order", () => {
  const original = `${markers("preamble")}\n${CONSTRAINT_SEED_PREAMBLE}\n${markers("memory")}\n${"只改文案时不查。用户要求记住、纠正你、给出约定，或结论已经验证时才沉淀。个人偏好和密钥只进 `user`；不检索就会做错事的规则，直接写进硬约束区块。"}\n${markers("tasks")}\n既有任务。\n`;
  const node = nodeWith(original);
  node.refreshConstraintSeeds(["memory", "notes", "tasks"]);
  assert.ok(node.body.indexOf(markers("notes")) > node.body.indexOf(markers("memory")));
  assert.ok(node.body.indexOf(markers("notes")) < node.body.indexOf(markers("tasks")));
});

test("inserts the preamble after the constraints heading, or at document start without a heading", () => {
  const withHeading = nodeWith("Authored text.\n");
  withHeading.refreshConstraintSeeds([]);
  assert.ok(withHeading.body.indexOf(markers("preamble")) > withHeading.body.indexOf("## 本层硬约束"));
  const noHeading = nodeWith("Existing text.\n", "");
  noHeading.refreshConstraintSeeds([]);
  assert.ok(noHeading.body.indexOf(markers("preamble")) < noHeading.body.indexOf("Existing text."));
});

test("refreshes official text and normalizes blank lines without changing edited text", () => {
  const points = "只改文案时不查。用户要求记住、纠正你、给出约定，或结论已经验证时才沉淀。个人偏好和密钥只进 `user`；不检索就会做错事的规则，直接写进硬约束区块。";
  const node = nodeWith(`${markers("preamble")}\n\n${CONSTRAINT_SEED_PREAMBLE}\n\n${markers("memory")}\n${points}\n`);
  assert.equal(node.refreshConstraintSeeds(["memory"]), true);
  assert.equal(node.body.includes(`${markers("preamble")}\n${CONSTRAINT_SEED_PREAMBLE}\n`), true);
  const edited = nodeWith(`${markers("preamble")}\nUser edited this.\n${markers("memory")}\nUser edited memory.\n`);
  edited.refreshConstraintSeeds(["memory"]);
  assert.match(edited.body, /User edited this\./);
  assert.match(edited.body, /User edited memory\./);
});

test("removes old official lines including list prefixes and is idempotent", () => {
  const old = "- 本目录有项目记忆。提问或动手前用 `$edges-memory-ask`；该沉淀用 `$edges-memory-remember`。本轮查过不重复。\n- 本层硬约束直接写在这个区块里，不要链到记忆正文文件。\n本层硬约束直接写在这个区块里，不要通过记忆正文链接代替本区块的硬约束。\nKeep me.\n";
  const node = nodeWith(old);
  assert.equal(node.refreshConstraintSeeds([]), true);
  assert.ok(!node.body.includes("$edges-memory-ask"));
  assert.ok(!node.body.includes("不要链到记忆正文文件"));
  assert.ok(!node.body.includes("通过记忆正文链接代替"));
  assert.ok(node.body.includes("Keep me."));
  assert.equal(node.refreshConstraintSeeds([]), false);
});

test("does not modify documents without a constraints section", () => {
  const node = new AgentsNode("/scope/AGENTS.md").parse("# Scope\n\nNo section.\n");
  assert.equal(node.refreshConstraintSeeds(["memory"]), false);
  assert.equal(node.body, "# Scope\n\nNo section.\n");
});

test("seed declarations match the ADR 0059 official text verbatim", async () => {
  const { readFile } = await import("node:fs/promises");
  const { MATERIAL_TYPES } = await import("../../src/domain/config/material-types.js");
  const adr = await readFile(new URL("../../../../docs/adr/0059-shared-preamble-and-per-type-deltas.md", import.meta.url), "utf8");
  const lines = adr.split("\n");
  assert.ok(lines.includes(CONSTRAINT_SEED_PREAMBLE));
  for (const type of MATERIAL_TYPES) assert.ok(lines.includes(type.constraint), type.id);
});

test("super scopes resolve initialized types against the scope root", () => {
  assert.deepEqual(
    getInitializedConstraintTypes(["/scope/tasks/README.md", "/scope/memory/feedbacks/README.md", "/elsewhere/notes/README.md"], "/scope"),
    ["memory", "tasks"],
  );
});

test("full refresh output keeps the official layout byte for byte", () => {
  const node = nodeWith("\n- 用户约束\n");
  node.refreshConstraintSeeds(["tasks", "memory"]);
  const memory = "只改文案时不查。用户要求记住、纠正你、给出约定，或结论已经验证时才沉淀。个人偏好和密钥只进 `user`；不检索就会做错事的规则，直接写进硬约束区块。";
  const tasks = "提到待办、进度、下一步，或者要新开任务时先查；同一个意图已经有卡就沿用。可以写成文字提议开卡，背景和目标要有对话依据。";
  assert.equal(
    node.body,
    section(`${markers("preamble")}\n${CONSTRAINT_SEED_PREAMBLE}\n\n- 用户约束\n${markers("memory")}\n${memory}\n${markers("tasks")}\n${tasks}\n`),
  );
});
