import test from "node:test";
import assert from "node:assert/strict";
import { TASK_STATUSES } from "../../../src/tasks/utils/types.js";
import {
  isTaskStatus,
  boardRoot,
  taskRelPath,
  sidecarRelPath,
  isTaskMarkdownName,
  parseTarget,
} from "../../../src/tasks/utils/paths.js";

test("TASK_STATUSES is the seven ADR 0002 values in folder order", () => {
  assert.deepEqual(TASK_STATUSES, [
    "backlog",
    "todo",
    "in_progress",
    "in_review",
    "done",
    "blocked",
    "cancelled",
  ]);
});

test("isTaskStatus rejects Run-layer and old enums", () => {
  assert.equal(isTaskStatus("in_progress"), true);
  assert.equal(isTaskStatus("completed"), false);
  assert.equal(isTaskStatus("open"), false);
  assert.equal(isTaskStatus("status"), false);
});

test("paths join knowledge/tasks/<project-dir>/<status> and sidecar dotfile", () => {
  assert.equal(boardRoot("/repo"), "/repo/knowledge/tasks");
  assert.equal(
    taskRelPath("default", "in_progress", "2026-09-11--cli"),
    "knowledge/tasks/_default/in_progress/2026-09-11--cli.md",
  );
  assert.equal(
    sidecarRelPath("default", "in_progress", "2026-09-11--cli"),
    "knowledge/tasks/_default/in_progress/.2026-09-11--cli.log.md",
  );
  assert.equal(
    taskRelPath("cli", "todo", "2026-09-11--cli"),
    "knowledge/tasks/cli/todo/2026-09-11--cli.md",
  );
});

test("isTaskMarkdownName skips sidecar, AGENTS, README", () => {
  assert.equal(isTaskMarkdownName("2026-09-11--cli.md"), true);
  assert.equal(isTaskMarkdownName(".2026-09-11--cli.log.md"), false);
  assert.equal(isTaskMarkdownName("AGENTS.md"), false);
  assert.equal(isTaskMarkdownName("README.md"), false);
});

test("parseTarget still accepts stem or new-layout path", () => {
  assert.deepEqual(parseTarget("2026-09-11--cli"), { kind: "stem", stem: "2026-09-11--cli" });
  assert.deepEqual(parseTarget("knowledge/tasks/_default/done/2026-09-11--cli.md"), {
    kind: "path",
    stem: "2026-09-11--cli",
  });
  assert.deepEqual(parseTarget("knowledge/tasks/cli/todo/2026-09-11--cli.md"), {
    kind: "path",
    stem: "2026-09-11--cli",
  });
});
