import test from "node:test";
import assert from "node:assert/strict";
import { taskFileSlug, taskNameSlug, newTaskStem } from "../../../src/domain/models/tasks/slug.js";

test("taskFileSlug keeps CJK and hyphenates spaces", () => {
  assert.equal(taskFileSlug("tasks 配套 skill"), "tasks-配套-skill");
  assert.equal(taskFileSlug("Hello World!"), "Hello-World");
  assert.equal(taskFileSlug("a/b:c"), "abc");
  assert.equal(taskFileSlug("???"), "task");
});

test("taskNameSlug keeps unicode letters and digits", () => {
  assert.equal(taskNameSlug("中文标题"), "中文标题");
  assert.equal(taskNameSlug("为 Edges CLI 建立 scope"), "为_edges_cli_建立_scope");
  assert.equal(taskNameSlug("edges-cli 完整编译"), "edges_cli_完整编译");
  assert.equal(taskNameSlug("CLI + Skill + MCP"), "cli_skill_mcp");
  assert.equal(taskNameSlug("index.md"), "indexmd");
  assert.equal(taskNameSlug("???"), "task");
  assert.equal(taskNameSlug("---"), "task");
});

test("newTaskStem uses local calendar date", () => {
  const now = new Date(2026, 8, 13, 15, 0, 0);
  assert.equal(newTaskStem("edges tasks CLI", now), "2026-09-13--edges-tasks-CLI");
});
