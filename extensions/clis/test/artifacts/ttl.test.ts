import test from "node:test";
import assert from "node:assert/strict";
import { parseTtlSeconds } from "../../src/artifacts/utils/ttl.js";

test("parseTtlSeconds accepts bare seconds and duration suffixes", () => {
  assert.equal(parseTtlSeconds("3600"), 3600);
  assert.equal(parseTtlSeconds("24h"), 86_400);
  assert.equal(parseTtlSeconds("1d"), 86_400);
  assert.equal(parseTtlSeconds("90m"), 5_400);
  assert.equal(parseTtlSeconds("30s"), 30);
});

test("parseTtlSeconds rejects invalid durations", () => {
  assert.throws(() => parseTtlSeconds("0"), /ttl/);
  assert.throws(() => parseTtlSeconds("-1"), /ttl/);
  assert.throws(() => parseTtlSeconds("24x"), /ttl/);
  assert.throws(() => parseTtlSeconds(""), /ttl/);
});
