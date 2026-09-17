import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { nodeBoardWriter } from "./utils/helpers.js";
import {
  createProject,
  getProject,
  listProjects,
  updateProject,
} from "../../src/tasks/utils/project-meta.js";

async function virginRepo(): Promise<string> {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-proj-"));
  await mkdir(path.join(repo, "knowledge/tasks"), { recursive: true });
  return repo;
}

test("create/list/get/update project metadata; create default on virgin board", async () => {
  const repo = await virginRepo();
  try {
    const createdDefault = await createProject(
      repo,
      {
        project: "default",
        title: "Default",
        description: "Ungrouped tasks that have not been assigned a named Task Project.",
      },
      nodeBoardWriter(),
    );
    assert.equal(createdDefault.project, "default");
    assert.equal(createdDefault.dir, "_default");
    assert.equal(createdDefault.path, "knowledge/tasks/_default/AGENTS.md");

    const created = await createProject(
      repo,
      { project: "cli", title: "CLI", description: "edges CLI work" },
      nodeBoardWriter(),
    );
    assert.equal(created.project, "cli");
    assert.equal(created.path, "knowledge/tasks/cli/AGENTS.md");

    const listed = await listProjects(repo, nodeBoardWriter());
    assert.deepEqual(
      listed.map((item) => item.project),
      ["default", "cli"],
    );

    const got = await getProject(repo, "cli", nodeBoardWriter());
    assert.equal(got.title, "CLI");
    assert.equal(got.description, "edges CLI work");

    const updated = await updateProject(
      repo,
      "cli",
      { description: "updated CLI" },
      nodeBoardWriter(),
    );
    assert.equal(updated.description, "updated CLI");
    assert.equal(updated.title, "CLI");

    const root = await readFile(path.join(repo, "knowledge/tasks/AGENTS.md"), "utf8");
    assert.match(root, /updated CLI/);
    assert.match(root, /<!-- task-projects:start -->/);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("createProject duplicate and getProject missing", async () => {
  const repo = await virginRepo();
  try {
    await createProject(
      repo,
      { project: "cli", title: "CLI", description: "edges CLI work" },
      nodeBoardWriter(),
    );
    await assert.rejects(
      () =>
        createProject(
          repo,
          { project: "cli", title: "CLI", description: "edges CLI work" },
          nodeBoardWriter(),
        ),
      (error: unknown) => {
        assert.equal((error as { errorCode: string }).errorCode, "VALIDATION_ERROR");
        assert.match((error as Error).message, /project already exists: cli/);
        return true;
      },
    );
    await assert.rejects(
      () => getProject(repo, "docs", nodeBoardWriter()),
      (error: unknown) => {
        assert.equal((error as { errorCode: string }).errorCode, "PROJECT_NOT_FOUND");
        assert.match((error as Error).message, /project not found: docs/);
        return true;
      },
    );
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("updateProject preserves pointers and does not rewrite a Task file", async () => {
  const repo = await virginRepo();
  try {
    await createProject(
      repo,
      { project: "cli", title: "CLI", description: "edges CLI work" },
      nodeBoardWriter(),
    );
    await writeFile(
      path.join(repo, "knowledge/tasks/cli/AGENTS.md"),
      "# CLI\n\nedges CLI work\n\n## Pointers\n\n- keep\n",
      "utf8",
    );
    const taskRel = "knowledge/tasks/_default/backlog/2026-09-13--keep.md";
    await mkdir(path.join(repo, "knowledge/tasks/_default/backlog"), { recursive: true });
    await writeFile(
      path.join(repo, taskRel),
      "---\nmetadata:\n  edges-tasks-status: backlog\n  edges-task-priority: high\n---\n\nbody\n",
      "utf8",
    );
    await updateProject(repo, "cli", { title: "CLI work" }, nodeBoardWriter());
    const agents = await readFile(path.join(repo, "knowledge/tasks/cli/AGENTS.md"), "utf8");
    assert.match(agents, /^# CLI work\n/);
    assert.match(agents, /## Pointers\n\n- keep\n/);
    const task = await readFile(path.join(repo, taskRel), "utf8");
    assert.match(task, /edges-tasks-status: backlog/);
    assert.match(task, /edges-task-priority: high/);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("createProject rejects _default as the CLI id", async () => {
  const repo = await virginRepo();
  try {
    await assert.rejects(
      () =>
        createProject(
          repo,
          { project: "_default", title: "Default", description: "x" },
          nodeBoardWriter(),
        ),
      (error: unknown) => {
        assert.equal((error as { errorCode: string }).errorCode, "VALIDATION_ERROR");
        return true;
      },
    );
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});
