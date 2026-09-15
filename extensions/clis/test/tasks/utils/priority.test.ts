import test from "node:test";
import assert from "node:assert/strict";
import {
  TASK_PRIORITIES,
  compareTaskPriority,
  filterTasksByPriority,
  isTaskPriority,
  parseTaskPriority,
  priorityFromMetadata,
  sortTasksByPriority,
} from "../../../src/tasks/utils/priority.js";

test("TASK_PRIORITIES is urgent high medium low none", () => {
  assert.deepEqual([...TASK_PRIORITIES], ["urgent", "high", "medium", "low", "none"]);
});

test("parseTaskPriority accepts the five words and rejects P0 / Urgent", () => {
  assert.equal(parseTaskPriority("none"), "none");
  assert.equal(parseTaskPriority("urgent"), "urgent");
  assert.equal(isTaskPriority("high"), true);
  assert.equal(isTaskPriority("P0"), false);
  assert.equal(isTaskPriority("Urgent"), false);
  try {
    parseTaskPriority("P0");
    assert.fail("expected throw");
  } catch (error) {
    assert.equal((error as { errorCode: string }).errorCode, "VALIDATION_ERROR");
    assert.match((error as Error).message, /P0/);
  }
  try {
    parseTaskPriority("Urgent");
    assert.fail("expected throw");
  } catch (error) {
    assert.equal((error as { errorCode: string }).errorCode, "VALIDATION_ERROR");
  }
});

test("priorityFromMetadata treats missing empty and unknown as none", () => {
  assert.equal(priorityFromMetadata({}), "none");
  assert.equal(priorityFromMetadata({ "edges-task-priority": "" }), "none");
  assert.equal(priorityFromMetadata({ "edges-task-priority": "P0" }), "none");
  assert.equal(priorityFromMetadata({ "edges-task-priority": "Urgent" }), "none");
  assert.equal(priorityFromMetadata({ "edges-task-priority": "high" }), "high");
});

test("sortTasksByPriority is urgent-to-none and stable", () => {
  const items = [
    { id: "b-none", priority: "none" as const },
    { id: "a-high", priority: "high" as const },
    { id: "c-urgent", priority: "urgent" as const },
    { id: "d-high", priority: "high" as const },
    { id: "e-low", priority: "low" as const },
    { id: "f-medium", priority: "medium" as const },
  ];
  const sorted = sortTasksByPriority(items);
  assert.deepEqual(
    sorted.map((item) => item.id),
    ["c-urgent", "a-high", "d-high", "f-medium", "e-low", "b-none"],
  );
  assert.equal(items[0]?.id, "b-none");
  assert.equal(compareTaskPriority("urgent", "none") < 0, true);
});

test("filterTasksByPriority ORs the allowed set; empty means no filter", () => {
  const items = [
    { id: "u", priority: "urgent" as const },
    { id: "h", priority: "high" as const },
    { id: "n", priority: "none" as const },
  ];
  assert.deepEqual(
    filterTasksByPriority(items, ["urgent", "high"]).map((item) => item.id),
    ["u", "h"],
  );
  assert.deepEqual(
    filterTasksByPriority(items, ["none"]).map((item) => item.id),
    ["n"],
  );
  assert.equal(filterTasksByPriority(items, []).length, 3);
});
