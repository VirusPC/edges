import assert from "node:assert/strict";
import { test } from "node:test";
import { query } from "../../src/domain/operations/query.js";

test("chains defer every callback and factory, rerun and leave ancestors unchanged", async () => {
  let started = 0,
    mapped = 0;
  const input = query(async function* () {
    started++;
    yield 1;
    yield 2;
    yield 3;
  });
  const grouped = input.filter((n) => n > 1).groupBy((n) => n % 2);
  const summary = grouped
    .mapValues(async (items) => {
      mapped++;
      return items.length;
    })
    .values()
    .map((n) => n * 10)
    .toArray();
  const first = input.find((n) => n === 2).thru((n) => n! * 10);
  assert.equal(started, 0);
  assert.equal(mapped, 0);
  assert.deepEqual(await summary.value(), [10, 10]);
  assert.deepEqual(await summary.value(), [10, 10]);
  assert.equal(started, 2);
  assert.equal(mapped, 4);
  assert.deepEqual(await grouped.value(), { "0": [2], "1": [3] });
  assert.equal(await first.value(), 20);
  assert.equal(started, 4);
});
test("find closes upstream immediately, including on predicate errors", async () => {
  const events: string[] = [];
  const input = query(async function* () {
    try {
      yield 1;
      events.push("next");
      yield 2;
    } finally {
      events.push("closed");
    }
  });
  assert.equal(await input.find(async (n) => n === 1).value(), 1);
  assert.deepEqual(events, ["closed"]);
  await assert.rejects(
    input
      .map(() => {
        throw Error("callback");
      })
      .value(),
    /callback/,
  );
  assert.deepEqual(events, ["closed", "closed"]);
});
test("materialization barriers consume upstream before downstream find", async () => {
  let count = 0;
  const input = query(async function* () {
    for (const n of [1, 2, 3]) {
      count++;
      yield n;
    }
  });
  assert.deepEqual(
    await input
      .groupBy((n) => n % 2)
      .find((items) => items.includes(2))
      .value(),
    [2],
  );
  assert.equal(count, 3);
  assert.equal(
    await input
      .toArray()
      .find((n) => n === 1)
      .value(),
    1,
  );
  assert.equal(count, 6);
});
test("grouping follows ordinary property keys and safe enumerable object values", async () => {
  const symbol = Symbol("group");
  const input = query(async function* () {
    yield* [1, "1", undefined, "__proto__", symbol, "10", "2"];
  });
  const grouped = input.groupBy((value) => value);
  const result = await grouped.value();
  assert.equal(Object.getPrototypeOf(result), Object.prototype);
  assert.deepEqual(result["1"], [1, "1"]);
  assert.deepEqual(result.undefined, [undefined]);
  assert.deepEqual(result.__proto__, ["__proto__"]);
  assert.deepEqual(result[symbol], [symbol]);
  assert.deepEqual(
    await grouped
      .mapValues((_value, key) => key)
      .values()
      .value(),
    ["1", "2", "10", "undefined", "__proto__"],
  );
  assert.deepEqual(
    await grouped
      .filter((items) => items.length === 2)
      .map((items) => items.length)
      .value(),
    [2],
  );
});
test("async callbacks are sequential, empty input and factory errors reject only value", async () => {
  const events: number[] = [];
  const input = query(async function* () {
    yield 1;
    yield 2;
  });
  assert.deepEqual(
    await input
      .filter(async (n) => {
        await Promise.resolve();
        events.push(n);
        return true;
      })
      .map(async (n) => {
        events.push(n * 10);
        return n;
      })
      .value(),
    [1, 2],
  );
  assert.deepEqual(events, [1, 10, 2, 20]);
  const empty = query(async function* () {});
  assert.deepEqual(await empty.value(), []);
  assert.equal(await empty.find(() => true).value(), undefined);
  assert.deepEqual(await empty.groupBy(String).value(), {});
  const bad = query<number>(() => {
    throw Error("factory");
  });
  await assert.rejects(bad.value(), /factory/);
});
