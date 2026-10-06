import {
  query,
  type Deferred,
  type AsyncQuery,
  type ObjectQuery,
} from "../../src/operations/query.js";
const input = query(async function* (): AsyncGenerator<string | number> {
  yield "one";
  yield 2;
});
const strings: AsyncQuery<string> = input.filter(
  (value): value is string => typeof value === "string",
);
const lengths: AsyncQuery<number> = strings.map((value) => value.length);
const found: Deferred<string | undefined> = input.find(
  (value): value is string => typeof value === "string",
);
const title: Deferred<number | undefined> = found.thru(
  (value) => value?.length,
);
const groups: ObjectQuery<number[]> = lengths.groupBy((value) => value % 2);
groups.filter((values) => values.includes(1));
// @ts-expect-error grouped filter receives an array, not one source item
groups.filter((value: number) => value > 0);
const summaries: ObjectQuery<string> = groups.mapValues(
  (values, key) => key + values.length,
);
const continued: AsyncQuery<number> = summaries
  .values()
  .filter((value) => value.length > 0)
  .map((value) => value.length);
const materialized: AsyncQuery<string> = lengths.toArray().map(String);
void [title, continued, materialized];
