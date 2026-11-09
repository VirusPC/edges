import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { run } from "../../src/program.js";
import { boardLocationOf } from "../../src/services/tasks/node-query.js";

function fixture(t: test.TestContext) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(tmpdir()), "super-project-"));
  fs.writeFileSync(path.join(root, "AGENTS.md"), "# Scope\n");
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const call = (...args: string[]) => run(["--scope", root, ...args], { env: {} });
  const ok = async (...args: string[]) => {
    const result = await call(...args);
    assert.equal(result.exitCode, 0, result.stdout + result.stderr);
    return JSON.parse(result.stdout);
  };
  return { root, call, ok };
}

function projectSelection(file: string, face: "harness" | "super") {
  const base = face === "super" ? "projects" : path.join(".edges", "projects");
  return path.relative(base, path.dirname(file)).split(path.sep).join("/");
}

test("super Project selection uses <scope>/projects and leaves the harness face unchanged", async (t) => {
  const { root, call, ok } = fixture(t);
  const harness = await ok("projects", "create", "--title", "Harness");
  const harnessPath = projectSelection(harness.path, "harness");
  const face = await ok("--super", "projects", "create", "--title", "Face");
  const facePath = projectSelection(face.path, "super");
  assert.equal(face.path.startsWith(`projects/${facePath}/`), true);
  assert.equal(harness.path.startsWith(`.edges/projects/${harnessPath}/`), true);

  const missed = await call("--super", "--project", harnessPath, "notes", "create", "--title", "Wrong face");
  assert.notEqual(missed.exitCode, 0, missed.stdout);
  const other = await call("--project", facePath, "notes", "create", "--title", "Wrong face");
  assert.notEqual(other.exitCode, 0, other.stdout);

  const note = await ok("--super", "--project", facePath, "notes", "create", "--title", "Face note");
  assert.equal(path.dirname(path.dirname(note.path)), `projects/${facePath}/notes`);
  const harnessNote = await ok("--project", harnessPath, "notes", "create", "--title", "Harness note");
  assert.equal(path.dirname(path.dirname(harnessNote.path)), `.edges/projects/${harnessPath}/notes`);

  const child = await ok("--super", "--project", facePath, "projects", "create", "--title", "Child");
  const childPath = projectSelection(child.path, "super");
  assert.match(childPath, new RegExp(`^${facePath}/projects/.+--child$`));
  const nested = await ok("--super", "--project", childPath, "notes", "create", "--title", "Nested");
  assert.equal(path.dirname(path.dirname(nested.path)), `projects/${childPath}/notes`);

  const routine = await ok("--super", "--project", facePath, "routines", "create", "weekly", "--description", "Review");
  assert.equal(path.dirname(path.dirname(routine.path)), `projects/${facePath}/routines`);
  assert.equal((await ok("--super", "--project", facePath, "routines", "get", "weekly")).description, "Review");

  await ok("--super", "--project", facePath, "memory", "init", "--memory-types", "project");
  const memory = await ok(
    "--super", "--project", facePath, "memory", "remember",
    "--type", "project", "--slug", "context", "--title", "Context",
    "--description", "Known context", "--content", "Known context",
  );
  assert.equal(memory.path, `projects/${facePath}/memory/projects/project_context/INDEX.md`);
  assert.equal((await ok("--super", "--project", facePath, "memory", "get", "--type", "project", "--slug", "context")).slug, "context");

  const task = await ok("--super", "--project", facePath, "tasks", "create", "--title", "Face task");
  assert.equal(task.project, facePath);
  assert.equal(task.path.startsWith(`projects/${facePath}/tasks/`), true);
  const listed = await ok("--super", "--project", facePath, "tasks", "list");
  const item = listed.tasks.find((row: { stem: string }) => row.stem === task.stem);
  assert.equal(item.project, facePath);
  assert.equal(item.source.purpose, "domain");
  assert.equal(item.source.scope, ".");

  const destination = await ok("--super", "projects", "create", "--title", "Destination");
  const destinationPath = projectSelection(destination.path, "super");
  const moved = await ok("--super", "--project", facePath, "tasks", "update", task.stem, "--to-project", destinationPath);
  assert.equal(moved.project, destinationPath);
  assert.equal(moved.path.startsWith(`projects/${destinationPath}/tasks/`), true);
  const returned = await ok("--super", "--project", destinationPath, "tasks", "update", task.stem, "--to-default");
  assert.equal(returned.project, undefined);
  assert.equal(returned.path.startsWith("tasks/"), true);
  assert.equal(returned.path.includes(".edges/"), false);

  const board = path.join(root, "projects", facePath, "tasks");
  assert.deepEqual(boardLocationOf(board, root), {
    scopeDir: root,
    purpose: "domain",
    project: path.join(root, "projects", facePath),
    boardDir: board,
    super: true,
  });
  assert.equal(fs.existsSync(path.join(root, ".edges", "projects", facePath)), false);
});
