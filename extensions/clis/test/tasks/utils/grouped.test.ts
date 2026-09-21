import test from "node:test";
import assert from "node:assert/strict";
import {
  GROUPED_LIST_SCHEMA,
  buildGroupedList,
  groupedListToReviewPageInput,
  parseGroupedList,
} from "../../../src/tasks/utils/grouped.js";
import { TasksError } from "../../../src/tasks/utils/types.js";

test("buildGroupedList emits edges.tasks.grouped/v1 with groups and items", () => {
  const grouped = buildGroupedList(
    [{
      stem: "2026-09-21--alpha",
      title: "Alpha",
      status: "todo",
      description: "first",
      path: "knowledge/tasks/_default/todo/2026-09-21--alpha.md",
      sidecarPath: "knowledge/tasks/_default/todo/.2026-09-21--alpha.log.md",
      runCount: 0,
      priority: "high",
      project: "default",
    }],
    [{ id: "default", title: "Default", description: "ungrouped" }],
  );
  assert.equal(grouped.schema, "edges.tasks.grouped/v1");
  assert.equal(grouped.schema, GROUPED_LIST_SCHEMA);
  assert.equal(grouped.groups[0]?.id, "default");
  assert.equal(grouped.items[0]?.id, "2026-09-21--alpha");
  assert.equal(grouped.items[0]?.stem, "2026-09-21--alpha");
  assert.equal(grouped.items[0]?.group, "default");
  assert.equal(grouped.items[0]?.status, "todo");
  assert.equal("current" in grouped.items[0]!, false);
  assert.equal("suggested" in grouped.items[0]!, false);
  assert.equal("tasks" in grouped, false);
});

test("parseGroupedList accepts envelope or raw schema and id or stem", () => {
  const fromStem = parseGroupedList({
    status: "success",
    command: "list",
    schema: "edges.tasks.grouped/v1",
    groups: [{ id: "default", title: "Default" }],
    items: [{ stem: "2026-09-21--alpha", group: "default" }],
  });
  assert.equal(fromStem.items[0]?.id, "2026-09-21--alpha");

  const fromRawId = parseGroupedList({
    schema: "edges.tasks.grouped/v1",
    groups: [{ id: "cli", title: "CLI" }],
    items: [{ id: "2026-09-21--beta", group: "cli" }],
  });
  assert.equal(fromRawId.items[0]?.id, "2026-09-21--beta");
  assert.equal(fromRawId.items[0]?.stem, "2026-09-21--beta");
});

test("parseGroupedList rejects missing schema, arrays, or identity", () => {
  assert.throws(
    () => parseGroupedList({ groups: [], items: [] }),
    (error: unknown) => {
      assert.equal((error as TasksError).errorCode, "VALIDATION_ERROR");
      return true;
    },
  );
  assert.throws(
    () =>
      parseGroupedList({
        schema: "edges.tasks.grouped/v0",
        groups: [{ id: "default", title: "Default" }],
        items: [],
      }),
    (error: unknown) => {
      assert.equal((error as TasksError).errorCode, "VALIDATION_ERROR");
      return true;
    },
  );
  assert.throws(
    () =>
      parseGroupedList({
        schema: "edges.tasks.grouped/v1",
        groups: [{ id: "", title: "Default" }],
        items: [],
      }),
    (error: unknown) => {
      assert.equal((error as TasksError).errorCode, "VALIDATION_ERROR");
      return true;
    },
  );
  assert.throws(
    () =>
      parseGroupedList({
        schema: "edges.tasks.grouped/v1",
        groups: [{ id: "default", title: "Default" }],
        items: [{ group: "default" }],
      }),
    (error: unknown) => {
      assert.equal((error as TasksError).errorCode, "VALIDATION_ERROR");
      return true;
    },
  );
});

test("groupedListToReviewPageInput maps group → current/suggested without renaming schema", () => {
  const page = groupedListToReviewPageInput({
    schema: "edges.tasks.grouped/v1",
    groups: [{ id: "cli", title: "CLI" }],
    items: [{ id: "2026-09-21--beta", group: "cli", title: "Beta" }],
  });
  assert.equal(page.items[0]?.stem, "2026-09-21--beta");
  assert.equal(page.items[0]?.current, "cli");
  assert.equal(page.items[0]?.suggested, "cli");
  assert.equal("schema" in page, false);
});
