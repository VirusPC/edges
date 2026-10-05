import { writeIndexedTaskFixture as writeFile } from "./helpers.js";
import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  readFile,
  rm,
} from "node:fs/promises";
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
} from "../../../src/services/tasks/project-meta.js";

const defaultRecord = {
  project: "default" as const,
  dir: "_default",
  title: "Default",
  description:
    "Ungrouped tasks that have not been assigned a named Task Project.",
  path: "tasks/_default/AGENTS.md",
};
const cliRecord = {
  project: "cli",
  dir: "cli",
  title: "CLI",
  description: "edges CLI\nwork",
  path: "tasks/cli/AGENTS.md",
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
      assert.equal(
        (error as { errorCode: string }).errorCode,
        "VALIDATION_ERROR",
      );
      assert.match((error as Error).message, /invalid Task Project title/);
    }
  }
  for (const raw of ["", "   ", "x".repeat(2001)]) {
    try {
      parseProjectDescription(raw);
      assert.fail(`expected description throw for ${JSON.stringify(raw)}`);
    } catch (error) {
      assert.equal(
        (error as { errorCode: string }).errorCode,
        "VALIDATION_ERROR",
      );
      assert.match(
        (error as Error).message,
        /invalid Task Project description/,
      );
    }
  }
});

test("render and parse round-trip title, description, and optional pointers", () => {
  const rendered = renderProjectAgents({
    title: "Default",
    description: DEFAULT_PROJECT_DESCRIPTION,
  });
  assert.match(rendered, /^# Default\n\nUngrouped tasks that have not been assigned a named Task Project\.\n/);
  assert.match(rendered, /<!-- project-memory-important:start -->/);
  assert.match(rendered, /<!-- project-memory-local:start -->/);
  assert.match(rendered, /<!-- project-memory-children:start -->/);
  const defaultParsed = parseProjectAgents(rendered);
  assert.equal(defaultParsed.title, "Default");
  assert.equal(defaultParsed.description, DEFAULT_PROJECT_DESCRIPTION);
  assert.match(defaultParsed.tail ?? "", /<!-- project-memory-children:end -->/);

  const withPointers = renderProjectAgents({
    title: "CLI",
    description: "edges CLI work",
    pointers: "## Pointers\n\n- [readme](../../../extensions/cli/README.md)",
  });
  const parsed = parseProjectAgents(withPointers);
  assert.equal(parsed.title, "CLI");
  assert.equal(parsed.description, "edges CLI work");
  assert.match(parsed.pointers ?? "", /README.md/);
});

test("parseProjectAgents rejects frontmatter and accepts sparse node sections", () => {
  try {
    parseProjectAgents("---\nname: x\n---\n# T\n\nD\n");
    assert.fail("expected frontmatter throw");
  } catch (error) {
    assert.equal(
      (error as { errorCode: string }).errorCode,
      "VALIDATION_ERROR",
    );
    assert.match((error as Error).message, /must not have YAML frontmatter/);
  }
  assert.equal(
    parseProjectAgents(
      "# T\n\nD\n\n<!-- project-memory:start -->\n<!-- project-memory:end -->\n",
    ).description,
    "D",
  );
});

test("oneLineDescription collapses newlines", () => {
  assert.equal(oneLineDescription("edges CLI\nwork"), "edges CLI work");
});

test("rewriteRootAgents places its index in local while preserving authored constraints", () => {
  const existing = `# tasks\n\n${PROJECT_MEMORY_START}\n\n## 本层硬约束\n\n- keep me\n${PROJECT_MEMORY_END}\n`;
  const next = rewriteRootAgents(existing, [cliRecord, defaultRecord]);
  assert.match(next, /## 本层硬约束\n\n- keep me/);
  assert.ok(
    next.indexOf("<!-- project-memory-local:start -->") <
      next.indexOf(TASK_PROJECTS_START),
  );
  assert.match(next, /<!-- task-projects:start -->/);
  assert.ok(next.indexOf(TASK_PROJECTS_END) < next.indexOf(PROJECT_MEMORY_END));
  assert.match(
    next,
    /- \[`_default`\]\(_default\/AGENTS.md\) — Ungrouped tasks that have not been assigned a named Task Project\./,
  );
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
  assert.match(next, /<!-- project-memory:start -->\nkeep\n/);
  assert.ok(
    next.indexOf(TASK_PROJECTS_END) <
      next.indexOf("<!-- project-memory-local:end -->"),
  );
  assert.equal(next.split(TASK_PROJECTS_START).length - 1, 1);
});

test("rewriteRootAgents on empty file writes a sparse local section", () => {
  const next = rewriteRootAgents("", [defaultRecord]);
  assert.match(next, /## 本层记忆/);
  assert.doesNotMatch(next, /## 本层硬约束|## 下层记忆索引|## Task Projects/);
});

test("rewriteRootAgents rejects a start marker without an end marker", () => {
  try {
    rewriteRootAgents(`${TASK_PROJECTS_START}\n## Task Projects\n`, [
      defaultRecord,
    ]);
    assert.fail("expected throw");
  } catch (error) {
    assert.equal(
      (error as { errorCode: string }).errorCode,
      "VALIDATION_ERROR",
    );
    assert.match((error as Error).message, /malformed Task Projects markers/);
  }
});

test("projectAgentsRelPath uses _default for default", () => {
  assert.equal(projectAgentsRelPath("default"), "tasks/_default/AGENTS.md");
  assert.equal(projectAgentsRelPath("cli"), "tasks/cli/AGENTS.md");
});

test("ensureProjectMetadata seeds _default and root index without moving Task files", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-proj-"));
  try {
    const taskRel = "tasks/_default/backlog/2026-09-13--keep/index.md";
    await mkdir(path.join(repo, "tasks/_default/backlog"), { recursive: true });
    await writeFile(path.join(repo, taskRel), "# keep\n", "utf8");
    await mkdir(path.join(repo, "tasks/cli/todo"), { recursive: true });
    await writeFile(
      path.join(repo, "tasks/cli/todo/2026-09-13--other/index.md"),
      "---\nmetadata:\n  edges-task-project: cli\n  edges-tasks-status: todo\n---\n\nx\n",
      "utf8",
    );
    const rootAgents = path.join(repo, "tasks/AGENTS.md");
    await writeFile(
      rootAgents,
      `# tasks\n\n<!-- project-memory:start -->\n\n- keep-index\n<!-- project-memory:end -->\n`,
      "utf8",
    );

    const records = await ensureProjectMetadata(repo, nodeBoardWriter());
    assert.equal(records[0]?.project, "default");
    assert.equal(
      records.some((item) => item.project === "cli"),
      true,
    );

    const seeded = await readFile(
      path.join(repo, "tasks/_default/AGENTS.md"),
      "utf8",
    );
    assert.match(seeded, /^# Default\n/);
    const cliAgents = await readFile(
      path.join(repo, "tasks/cli/AGENTS.md"),
      "utf8",
    );
    assert.match(cliAgents, /^# cli\n/);
    assert.match(cliAgents, /Task Project cli\./);

    const root = await readFile(rootAgents, "utf8");
    assert.match(root, /- keep-index/);
    assert.match(root, /<!-- task-projects:start -->/);
    assert.ok(
      root.indexOf("<!-- task-projects:end -->") <
        root.indexOf("<!-- project-memory-local:end -->"),
    );

    const task = await readFile(path.join(repo, taskRel), "utf8");
    assert.equal(task, "# keep\n");
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("ensureProjectMetadata skipId leaves that AGENTS.md missing", async () => {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-proj-"));
  try {
    await mkdir(path.join(repo, "tasks"), { recursive: true });
    await ensureProjectMetadata(repo, nodeBoardWriter(), "default");
    await assert.rejects(
      readFile(path.join(repo, "tasks/_default/AGENTS.md"), "utf8"),
    );
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("project reads reject unindexed directories without creating metadata", async () => {
  const { getProject, listProjects } =
    await import("../../../src/services/tasks/project-meta.js");
  const { access } = await import("node:fs/promises");
  const repo = await mkdtemp(path.join(tmpdir(), "edges-project-read-"));
  try {
    await mkdir(path.join(repo, "tasks/cli/todo"), { recursive: true });
    const fs = nodeBoardWriter();
    await assert.rejects(listProjects(repo, fs), /index missing.*migrate/i);
    await assert.rejects(getProject(repo, 'cli', fs), /index missing.*migrate/i);
    for (const rel of [
      "tasks/cli/AGENTS.md",
      "tasks/AGENTS.md",
      "tasks/_default",
      "tasks/missing",
    ]) {
      await assert.rejects(access(path.join(repo, rel)));
    }
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test('refreshing a board adopts existing project references without duplicating composition', async () => {
  const { InternalNode } = await import('../../../src/models/internal-node.js');
  const file = '/fixture/tasks/AGENTS.md';
  const before = new InternalNode(file).create({localChildren:[{id:'/fixture/tasks/_default/AGENTS.md'}]},{operation:'create'}).serialize();
  const after = rewriteRootAgents(before,[defaultRecord]);
  assert.deepEqual(new InternalNode(file).parse(after).children.map(ref=>ref.id), ['/fixture/tasks/_default/AGENTS.md']);
});
