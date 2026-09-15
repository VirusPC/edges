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

test("paths join knowledge/tasks and sidecar dotfile", () => {
  assert.equal(boardRoot("/repo"), "/repo/knowledge/tasks");
  assert.equal(
    taskRelPath("in_progress", "2026-09-11--cli"),
    "knowledge/tasks/in_progress/2026-09-11--cli.md",
  );
  assert.equal(
    sidecarRelPath("in_progress", "2026-09-11--cli"),
    "knowledge/tasks/in_progress/.2026-09-11--cli.log.md",
  );
});

test("isTaskMarkdownName skips sidecar, AGENTS, README", () => {
  assert.equal(isTaskMarkdownName("2026-09-11--cli.md"), true);
  assert.equal(isTaskMarkdownName(".2026-09-11--cli.log.md"), false);
  assert.equal(isTaskMarkdownName("AGENTS.md"), false);
  assert.equal(isTaskMarkdownName("README.md"), false);
});

test("parseTarget accepts stem or path", () => {
  assert.deepEqual(parseTarget("2026-09-11--cli"), { kind: "stem", stem: "2026-09-11--cli" });
  assert.deepEqual(parseTarget("knowledge/tasks/done/2026-09-11--cli.md"), {
    kind: "path",
    stem: "2026-09-11--cli",
  });
});
