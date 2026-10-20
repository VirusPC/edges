import test from "node:test";
import assert from "node:assert/strict";
import { fieldText, groupRecords, matchesFilters, MISSING_FIELD } from "../../src/services/list-query.js";

test("missing fields match __undefined__ and empty strings stay separate", () => {
  assert.equal(fieldText({}, "status"), MISSING_FIELD);
  assert.equal(fieldText({ status: "" }, "status"), "");
  assert.equal(matchesFilters({}, [{ field: "status", value: MISSING_FIELD }]), true);
  assert.equal(matchesFilters({ status: "" }, [{ field: "status", value: MISSING_FIELD }]), false);
});

test("same field filters are OR and different fields are AND", () => {
  const record = { status: "todo", priority: "high" };
  assert.equal(
    matchesFilters(record, [
      { field: "status", value: "backlog" },
      { field: "status", value: "todo" },
    ]),
    true,
  );
  assert.equal(
    matchesFilters(record, [
      { field: "status", value: "todo" },
      { field: "priority", value: "low" },
    ]),
    false,
  );
});

test("objects group by sorted keys and numbers compare as text", () => {
  assert.equal(fieldText({ n: 1 }, "n"), "1");
  const groups = groupRecords(
    [{ meta: { b: 1, a: 2 } }, { meta: { a: 2, b: 1 } }, {}],
    "meta",
  );
  assert.equal(groups.length, 2);
  assert.equal(groups[0]?.items.length, 2);
  assert.equal(groups[1]?.key, MISSING_FIELD);
});
