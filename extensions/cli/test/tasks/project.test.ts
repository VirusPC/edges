import { mkdir as fixtureMkdir } from "node:fs/promises";
import { dirname as fixtureDirname } from "node:path";
async function writeFile(...args: Parameters<typeof fixtureRawWriteFile>) {
  await fixtureMkdir(fixtureDirname(String(args[0])), { recursive: true });
  return fixtureRawWriteFile(...args);
}
import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  readFile,
  writeFile as fixtureRawWriteFile,
  rm,
  access,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { nodeBoardWriter } from "./utils/helpers.js";
import {
  createProject,
  getProject,
  listProjects,
  updateProject,
} from "../../src/services/tasks/project-meta.js";

async function virginRepo(): Promise<string> {
  const repo = await mkdtemp(path.join(tmpdir(), "edges-proj-"));
  await mkdir(path.join(repo, "tasks"), { recursive: true });
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
        description:
          "Ungrouped tasks that have not been assigned a named Task Project.",
      },
      nodeBoardWriter(),
    );
    assert.equal(createdDefault.project, "default");
    assert.equal(createdDefault.dir, "_default");
    assert.equal(createdDefault.path, "tasks/_default/AGENTS.md");

    const created = await createProject(
      repo,
      { project: "cli", title: "CLI", description: "edges CLI work" },
      nodeBoardWriter(),
    );
    assert.equal(created.project, "cli");
    assert.equal(created.path, "tasks/cli/AGENTS.md");

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

    const root = await readFile(path.join(repo, "tasks/AGENTS.md"), "utf8");
    assert.match(root, /updated CLI/);
    assert.doesNotMatch(root, /task-projects:/);
    assert.match(root, /<!-- project-harness-local:start -->/);
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
        assert.equal(
          (error as { errorCode: string }).errorCode,
          "VALIDATION_ERROR",
        );
        assert.match((error as Error).message, /project already exists: cli/);
        return true;
      },
    );
    await assert.rejects(
      () => getProject(repo, "docs", nodeBoardWriter()),
      (error: unknown) => {
        assert.equal(
          (error as { errorCode: string }).errorCode,
          "PROJECT_NOT_FOUND",
        );
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
      path.join(repo, "tasks/cli/AGENTS.md"),
      "# CLI\n\nedges CLI work\n\n## Pointers\n\n- keep\n",
      "utf8",
    );
    const taskRel = "tasks/_default/backlog/2026-09-13--keep/index.md";
    await mkdir(path.join(repo, "tasks/_default/backlog"), { recursive: true });
    await writeFile(
      path.join(repo, taskRel),
      "---\nmetadata:\n  edges-tasks-status: backlog\n  edges-task-priority: high\n---\n\nbody\n",
      "utf8",
    );
    await updateProject(repo, "cli", { title: "CLI work" }, nodeBoardWriter());
    const agents = await readFile(
      path.join(repo, "tasks/cli/AGENTS.md"),
      "utf8",
    );
    assert.match(agents, /^# CLI work\n/);
    assert.match(agents, /## Pointers\n\n- keep\n/);
    const task = await readFile(path.join(repo, taskRel), "utf8");
    assert.match(task, /edges-tasks-status: backlog/);
    assert.match(task, /edges-task-priority: high/);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("updateProject seeds AGENTS.md when the project dir exists without metadata", async () => {
  const repo = await virginRepo();
  try {
    await mkdir(path.join(repo, "tasks/docs/backlog"), { recursive: true });
    await writeFile(
      path.join(repo, "tasks/docs/backlog/2026-09-17--orphan/index.md"),
      "---\nmetadata:\n  edges-tasks-status: backlog\n  edges-task-project: docs\n---\n\nbody\n",
      "utf8",
    );
    await assert.rejects(() =>
      readFile(path.join(repo, "tasks/docs/AGENTS.md"), "utf8"),
    );

    const updated = await updateProject(
      repo,
      "docs",
      { title: "Docs", description: "documentation work" },
      nodeBoardWriter(),
    );
    assert.equal(updated.project, "docs");
    assert.equal(updated.dir, "docs");
    assert.equal(updated.title, "Docs");
    assert.equal(updated.description, "documentation work");
    assert.equal(updated.path, "tasks/docs/AGENTS.md");

    const agents = await readFile(
      path.join(repo, "tasks/docs/AGENTS.md"),
      "utf8",
    );
    assert.match(agents, /^# Docs\n/);
    assert.match(agents, /documentation work/);
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
        assert.equal(
          (error as { errorCode: string }).errorCode,
          "VALIDATION_ERROR",
        );
        return true;
      },
    );
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("project get returns the read-only listed project after ordinary task creation", async () => {
  const { run } = await import("../../src/program.js");
  const repo = await mkdtemp(path.join(tmpdir(), "edges-project-get-"));
  try {
    const env = { EDGES_SCOPE: repo };
    const created = await run(
      [
        "tasks", "--index-group", "local",
        "--purpose",
        "maintenance",
        "create",
        "--title",
        "Fresh",
        "--project",
        "cli",
      ],
      { env },
    );
    assert.equal(created.exitCode, 0, created.stdout);
    const indexedPaths = [".harness/tasks/cli/AGENTS.md", ".harness/tasks/AGENTS.md", ".harness/tasks/_default/AGENTS.md"];
    const before = await Promise.all(indexedPaths.map(rel => readFile(path.join(repo, rel), "utf8")));
    const listed = JSON.parse(
      (
        await run(["tasks", "--index-group", "local", "--purpose", "maintenance", "project", "list"], {
          env,
        })
      ).stdout,
    );
    const got = await run(
      ["tasks", "--index-group", "local", "--purpose", "maintenance", "project", "get", "cli"],
      { env },
    );
    assert.equal(got.exitCode, 0, got.stdout);
    const { status, command, ...record } = JSON.parse(got.stdout);
    assert.equal(status, "success");
    assert.deepEqual(
      record,
      listed.projects.find((project: any) => project.project === "cli"),
    );
    assert.deepEqual(await Promise.all(indexedPaths.map(rel => readFile(path.join(repo, rel), "utf8"))), before);
    for (const rel of ["tasks"]) {
      await assert.rejects(access(path.join(repo, rel)));
    }
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

async function migrateProjectToReadme(repo: string, dir: string): Promise<void> {
  const agents = path.join(repo, "tasks", dir, "AGENTS.md");
  const original = await readFile(agents, "utf8");
  const head = original.split("<!-- project-harness")[0]!.trimEnd();
  await fixtureRawWriteFile(
    path.join(repo, "tasks", dir, "README.md"),
    `${head}\n\n<!-- project-entries-local:start -->\n## 本层内容\n\n- 暂无条目。\n<!-- project-entries-local:end -->\n`,
  );
  await rm(agents);
  const board = path.join(repo, "tasks/AGENTS.md");
  await fixtureRawWriteFile(
    board,
    (await readFile(board, "utf8")).replaceAll(`${dir}/AGENTS.md`, `${dir}/README.md`),
  );
}

test("README-held Task Projects are discovered, read, updated and never get a seed AGENTS", async () => {
  const repo = await virginRepo();
  try {
    const writer = nodeBoardWriter();
    await createProject(repo, { project: "cli", title: "CLI", description: "edges CLI work" }, writer);
    await createProject(repo, { project: "site", title: "Site", description: "site work" }, writer);
    await migrateProjectToReadme(repo, "cli");

    const listed = await listProjects(repo, writer);
    assert.deepEqual(listed.map((item) => [item.project, path.basename(item.path)]).sort(), [
      ["cli", "README.md"],
      ["default", "AGENTS.md"],
      ["site", "AGENTS.md"],
    ]);
    const got = await getProject(repo, "cli", writer);
    assert.equal(got.title, "CLI");
    assert.equal(got.description, "edges CLI work");
    assert.equal(got.path, "tasks/cli/README.md");

    const updated = await updateProject(repo, "cli", { description: "updated CLI" }, writer);
    assert.equal(updated.path, "tasks/cli/README.md");
    const readme = await readFile(path.join(repo, "tasks/cli/README.md"), "utf8");
    assert.match(readme, /^# CLI\n\nupdated CLI\n/);
    assert.match(readme, /<!-- project-entries-local:start -->\n## 本层内容\n\n- 暂无条目。/);
    await assert.rejects(access(path.join(repo, "tasks/cli/AGENTS.md")));

    await updateProject(repo, "site", { description: "site v2" }, writer);
    await assert.rejects(access(path.join(repo, "tasks/cli/AGENTS.md")));
    const board = await readFile(path.join(repo, "tasks/AGENTS.md"), "utf8");
    assert.match(board, /cli\/README\.md/);
    assert.match(board, /updated CLI/);
    assert.doesNotMatch(board, /cli\/AGENTS\.md/);
    assert.deepEqual((await listProjects(repo, writer)).map((p) => p.project).sort(), ["cli", "default", "site"]);

    await assert.rejects(
      createProject(repo, { project: "cli", title: "X", description: "dup" }, writer),
      /project already exists/,
    );
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("maintenance board: README-held project stays listed via CLI and gets no seed AGENTS", async () => {
  const { run } = await import("../../src/program.js");
  const repo = await mkdtemp(path.join(tmpdir(), "edges-project-readme-"));
  try {
    const env = { EDGES_SCOPE: repo };
    const args = ["tasks", "--index-group", "local", "--purpose", "maintenance"];
    assert.equal((await run([...args, "create", "--title", "Fresh", "--project", "cli"], { env })).exitCode, 0);
    const dir = path.join(repo, ".harness/tasks/cli");
    const original = await readFile(path.join(dir, "AGENTS.md"), "utf8");
    await fixtureRawWriteFile(
      path.join(dir, "README.md"),
      `${original.split("<!-- project-harness")[0]!.trimEnd()}\n\n<!-- project-entries-local:start -->\n## 本层内容\n\n- 暂无条目。\n<!-- project-entries-local:end -->\n`,
    );
    await rm(path.join(dir, "AGENTS.md"));
    const board = path.join(repo, ".harness/tasks/AGENTS.md");
    await fixtureRawWriteFile(board, (await readFile(board, "utf8")).replaceAll("cli/AGENTS.md", "cli/README.md"));

    const listed = JSON.parse((await run([...args, "project", "list"], { env })).stdout);
    const cli = listed.projects.find((p: any) => p.project === "cli");
    assert.equal(cli.path, ".harness/tasks/cli/README.md");
    const updated = await run([...args, "project", "update", "cli", "--description", "d2"], { env });
    assert.equal(updated.exitCode, 0, updated.stdout);
    await assert.rejects(access(path.join(dir, "AGENTS.md")));
    assert.match(await readFile(path.join(dir, "README.md"), "utf8"), /^# [^\n]+\n\nd2\n/);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});
