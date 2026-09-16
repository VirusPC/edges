import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_TASK_PROJECT,
  DEFAULT_TASK_PROJECT_DIR,
  TASK_PROJECT_FIELD,
  assertProjectDualWrite,
  filterTasksByProject,
  isTaskProjectId,
  isUserProjectSlug,
  parseTaskProject,
  projectDirName,
  projectIdFromDir,
} from "../../../src/tasks/utils/project.js";

test("sentinels and field name", () => {
  assert.equal(DEFAULT_TASK_PROJECT, "default");
  assert.equal(DEFAULT_TASK_PROJECT_DIR, "_default");
  assert.equal(TASK_PROJECT_FIELD, "edges-task-project");
});

test("parseTaskProject accepts default and kebab slugs; rejects reserved and junk", () => {
  assert.equal(parseTaskProject("default"), "default");
  assert.equal(parseTaskProject("cli"), "cli");
  assert.equal(parseTaskProject("task-board"), "task-board");
  assert.equal(isTaskProjectId("default"), true);
  assert.equal(isUserProjectSlug("default"), false);
  assert.equal(isUserProjectSlug("_default"), false);
  assert.equal(isUserProjectSlug("in_progress"), false);
  assert.equal(isUserProjectSlug("cli"), true);
  for (const raw of ["_default", "in_progress", "Default", "foo_bar", "foo/bar", "", "-cli", "cli-", "Foo"]) {
    assert.equal(isTaskProjectId(raw), false);
    try {
      parseTaskProject(raw);
      assert.fail(`expected throw for ${raw}`);
    } catch (error) {
      assert.equal((error as { errorCode: string }).errorCode, "VALIDATION_ERROR");
      assert.match((error as Error).message, /edges-task-project/);
    }
  }
});

test("projectDirName and projectIdFromDir round-trip default and slugs", () => {
  assert.equal(projectDirName("default"), "_default");
  assert.equal(projectDirName("cli"), "cli");
  assert.equal(projectIdFromDir("_default"), "default");
  assert.equal(projectIdFromDir("cli"), "cli");
  try {
    projectIdFromDir("backlog");
    assert.fail("expected throw");
  } catch (error) {
    assert.equal((error as { errorCode: string }).errorCode, "VALIDATION_ERROR");
  }
});

test("assertProjectDualWrite accepts default omit and matching slugs; rejects drift", () => {
  assert.equal(assertProjectDualWrite("_default", {}), "default");
  assert.equal(assertProjectDualWrite("_default", { "edges-task-project": "" }), "default");
  assert.equal(assertProjectDualWrite("_default", { "edges-task-project": "default" }), "default");
  assert.equal(assertProjectDualWrite("cli", { "edges-task-project": "cli" }), "cli");
  for (const [dir, field] of [
    ["_default", "cli"],
    ["cli", ""],
    ["cli", "default"],
    ["cli", "other"],
  ] as const) {
    try {
      assertProjectDualWrite(dir, field ? { "edges-task-project": field } : {});
      assert.fail(`expected mismatch for ${dir} / ${field || "(missing)"}`);
    } catch (error) {
      assert.equal((error as { errorCode: string }).errorCode, "VALIDATION_ERROR");
      assert.match((error as Error).message, /dual-write mismatch/);
    }
  }
});

test("filterTasksByProject empty allowed is no-op; otherwise OR", () => {
  const items = [
    { id: "a", project: "default" as const },
    { id: "b", project: "cli" },
    { id: "c", project: "docs" },
  ];
  assert.deepEqual(
    filterTasksByProject(items, []).map((item) => item.id),
    ["a", "b", "c"],
  );
  assert.deepEqual(
    filterTasksByProject(items, ["default", "docs"]).map((item) => item.id),
    ["a", "c"],
  );
});
