import test from "node:test";
import assert from "node:assert/strict";
import { taskFileSlug, taskNameSlug, newTaskStem } from "../src/tasks/slug.js";

test("taskFileSlug keeps CJK and hyphenates spaces", () => {
  assert.equal(taskFileSlug("tasks 配套 skill"), "tasks-配套-skill");
  assert.equal(taskFileSlug("Hello World!"), "Hello-World");
  assert.equal(taskFileSlug("a/b:c"), "abc");
  assert.equal(taskFileSlug("???"), "task");
});

test("taskNameSlug is ascii snake and falls back", () => {
  assert.equal(taskNameSlug("CLI + Skill + MCP"), "cli_skill_mcp");
  assert.equal(taskNameSlug("中文标题"), "task");
});

test("newTaskStem uses local calendar date", () => {
  const now = new Date(2026, 8, 13, 15, 0, 0);
  assert.equal(newTaskStem("edges tasks CLI", now), "2026-09-13--edges-tasks-CLI");
});
