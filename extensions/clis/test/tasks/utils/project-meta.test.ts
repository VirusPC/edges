import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { nodeBoardWriter } from "./helpers.js";
import {
  DEFAULT_PROJECT_DESCRIPTION,
  DEFAULT_PROJECT_TITLE,
  PROJECT_MEMORY_END,
  PROJECT_MEMORY_START,
  TASK_PROJECTS_END,
  TASK_PROJECTS_START,
  ensureProjectMetadata,
  oneLineDescription,
  parseProjectAgents,
  parseProjectDescription,
  parseProjectTitle,
  projectAgentsRelPath,
  renderProjectAgents,
  rewriteRootAgents,
  seedDescriptionFor,
  seedTitleFor,
} from "../../../src/tasks/utils/project-meta.js";

const defaultRecord = {
  project: "default" as const,
  dir: "_default",
  title: "Default",
  description: "Ungrouped tasks that have not been assigned a named Task Project.",
  path: "knowledge/tasks/_default/AGENTS.md",
};
const cliRecord = {
  project: "cli",
  dir: "cli",
  title: "CLI",
  description: "edges CLI\nwork",
  path: "knowledge/tasks/cli/AGENTS.md",
};

test("seed copy for default and user slugs", () => {
  assert.equal(DEFAULT_PROJECT_TITLE, "Default");
  assert.equal(
    DEFAULT_PROJECT_DESCRIPTION,
    "Ungrouped tasks that have not been assigned a named Task Project.",
  );
  assert.equal(seedTitleFor("default"), "Default");
  assert.equal(seedTitleFor("cli"), "cli");
  assert.equal(seedDescriptionFor("default"), DEFAULT_PROJECT_DESCRIPTION);
  assert.equal(seedDescriptionFor("cli"), "Task Project cli.");
});

test("parseProjectTitle and parseProjectDescription accept trimmed bounds", () => {
  assert.equal(parseProjectTitle("  CLI  "), "CLI");
  assert.equal(parseProjectDescription("  edges CLI work  "), "edges CLI work");
  for (const raw of ["", "   ", "x".repeat(121), "has\nnewline"]) {
    try {
      parseProjectTitle(raw);
      assert.fail(`expected title throw for ${JSON.stringify(raw)}`);
    } catch (error) {
      assert.equal((error as { errorCode: string }).errorCode, "VALIDATION_ERROR");
      assert.match((error as Error).message, /invalid Task Project title/);
    }
  }
  for (const raw of ["", "   ", "x".repeat(2001)]) {
    try {
      parseProjectDescription(raw);
      assert.fail(`expected description throw for ${JSON.stringify(raw)}`);
    } catch (error) {
      assert.equal((error as { errorCode: string }).errorCode, "VALIDATION_ERROR");
      assert.match((error as Error).message, /invalid Task Project description/);
    }
  }
});

test("render and parse round-trip title, description, and optional pointers", () => {
  const rendered = renderProjectAgents({
    title: "Default",
    description: DEFAULT_PROJECT_DESCRIPTION,
  });
  assert.equal(
    rendered,
    `# Default\n\nUngrouped tasks that have not been assigned a named Task Project.\n`,
  );
  assert.deepEqual(parseProjectAgents(rendered), {
    title: "Default",
    description: DEFAULT_PROJECT_DESCRIPTION,
  });

  const withPointers = renderProjectAgents({
    title: "CLI",
    description: "edges CLI work",
    pointers: "## Pointers\n\n- [readme](../../../extensions/clis/README.md)",
  });
  const parsed = parseProjectAgents(withPointers);
  assert.equal(parsed.title, "CLI");
  assert.equal(parsed.description, "edges CLI work");
  assert.match(parsed.pointers ?? "", /README.md/);
});

test("parseProjectAgents rejects frontmatter and project-memory markers", () => {
  try {
    parseProjectAgents("---\nname: x\n---\n# T\n\nD\n");
    assert.fail("expected frontmatter throw");
  } catch (error) {
    assert.equal((error as { errorCode: string }).errorCode, "VALIDATION_ERROR");
    assert.match((error as Error).message, /must not have YAML frontmatter/);
  }
  try {
    parseProjectAgents("# T\n\nD\n\n<!-- project-memory:start -->\n");
    assert.fail("expected project-memory throw");
  } catch (error) {
    assert.equal((error as { errorCode: string }).errorCode, "VALIDATION_ERROR");
    assert.match((error as Error).message, /must not contain project-memory markers/);
  }
});

test("oneLineDescription collapses newlines", () => {
  assert.equal(oneLineDescription("edges CLI\nwork"), "edges CLI work");
});

test("rewriteRootAgents inserts after project-memory end and does not touch the managed block", () => {
  const existing = `# tasks\n\n${PROJECT_MEMORY_START}\n\n## 本层硬约束\n\n- keep me\n${PROJECT_MEMORY_END}\n`;
  const next = rewriteRootAgents(existing, [cliRecord, defaultRecord]);
  const managed = existing.slice(
    existing.indexOf(PROJECT_MEMORY_START),
    existing.indexOf(PROJECT_MEMORY_END) + PROJECT_MEMORY_END.length,
  );
  const nextManaged = next.slice(
    next.indexOf(PROJECT_MEMORY_START),
    next.indexOf(PROJECT_MEMORY_END) + PROJECT_MEMORY_END.length,
  );
  assert.equal(nextManaged, managed);
  assert.match(next, /<!-- task-projects:start -->/);
  assert.ok(next.indexOf(PROJECT_MEMORY_END) < next.indexOf(TASK_PROJECTS_START));
  assert.match(next, /- \[`_default`\]\(_default\/AGENTS.md\) — Ungrouped tasks that have not been assigned a named Task Project\./);
  assert.match(next, /- \[`cli`\]\(cli\/AGENTS.md\) — edges CLI work/);
  const defaultLine = next.indexOf("[`_default`]");
  const cliLine = next.indexOf("[`cli`]");
  assert.ok(defaultLine < cliLine);
});

test("rewriteRootAgents replaces an existing Task Projects span only", () => {
  const existing = `${PROJECT_MEMORY_START}\nkeep\n${PROJECT_MEMORY_END}\n\n${TASK_PROJECTS_START}\n## Task Projects\n\nold\n${TASK_PROJECTS_END}\n\n# trailing\n`;
  const next = rewriteRootAgents(existing, [defaultRecord]);
  assert.match(next, /# trailing/);
  assert.doesNotMatch(next, /^old$/m);
  assert.equal(
    next.slice(next.indexOf(PROJECT_MEMORY_START), next.indexOf(PROJECT_MEMORY_END) + PROJECT_MEMORY_END.length),
    `${PROJECT_MEMORY_START}\nkeep\n${PROJECT_MEMORY_END}`,
  );
});

test("rewriteRootAgents on empty file writes only the Task Projects block", () => {
  const next = rewriteRootAgents("", [defaultRecord]);
  assert.ok(next.startsWith(TASK_PROJECTS_START));
  assert.doesNotMatch(next, /project-memory/);
});

test("rewriteRootAgents rejects a start marker without an end marker", () => {
  try {
    rewriteRootAgents(`${TASK_PROJECTS_START}\n## Task Projects\n`, [defaultRecord]);
    assert.fail("expected throw");
  } catch (error) {
    assert.equal((error as { errorCode: string }).errorCode, "VALIDATION_ERROR");
    assert.match((error as Error).message, /malformed Task Projects markers/);
  }
});

test("projectAgentsRelPath uses _default for default", () => {
  assert.equal(projectAgentsRelPath("default"), "knowledge/tasks/_default/AGENTS.md");
  assert.equal(projectAgentsRelPath("cli"), "knowledge/tasks/cli/AGENTS.md");
});

test("ensureProjectMetadata seeds _default and root index without moving Task files", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-proj-"));
  try {
    const taskRel = "knowledge/tasks/_default/backlog/2026-09-13--keep.md";
    await mkdir(path.join(repo, "knowledge/tasks/_default/backlog"), { recursive: true });
    await writeFile(path.join(repo, taskRel), "# keep\n", "utf8");
    await mkdir(path.join(repo, "knowledge/tasks/cli/todo"), { recursive: true });
    await writeFile(
      path.join(repo, "knowledge/tasks/cli/todo/2026-09-13--other.md"),
      "---\nmetadata:\n  edges-task-project: cli\n  edges-tasks-status: todo\n---\n\nx\n",
      "utf8",
    );
    const rootAgents = path.join(repo, "knowledge/tasks/AGENTS.md");
    await writeFile(
      rootAgents,
      `# tasks\n\n<!-- project-memory:start -->\n\n- keep-index\n<!-- project-memory:end -->\n`,
      "utf8",
    );

    const records = await ensureProjectMetadata(repo, nodeBoardWriter());
    assert.equal(records[0]?.project, "default");
    assert.equal(records.some((item) => item.project === "cli"), true);

    const seeded = await readFile(path.join(repo, "knowledge/tasks/_default/AGENTS.md"), "utf8");
    assert.match(seeded, /^# Default\n/);
    const cliAgents = await readFile(path.join(repo, "knowledge/tasks/cli/AGENTS.md"), "utf8");
    assert.match(cliAgents, /^# cli\n/);
    assert.match(cliAgents, /Task Project cli\./);

    const root = await readFile(rootAgents, "utf8");
    assert.match(root, /- keep-index/);
    assert.match(root, /<!-- task-projects:start -->/);
    assert.ok(root.indexOf("<!-- project-memory:end -->") < root.indexOf("<!-- task-projects:start -->"));

    const task = await readFile(path.join(repo, taskRel), "utf8");
    assert.equal(task, "# keep\n");
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("ensureProjectMetadata skipId leaves that AGENTS.md missing", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-proj-"));
  try {
    await mkdir(path.join(repo, "knowledge/tasks"), { recursive: true });
    await ensureProjectMetadata(repo, nodeBoardWriter(), "default");
    await assert.rejects(readFile(path.join(repo, "knowledge/tasks/_default/AGENTS.md"), "utf8"));
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});
