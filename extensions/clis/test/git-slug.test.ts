import test from "node:test";
import assert from "node:assert/strict";
import { titleToSlug, localDateYmd } from "../src/git/slug.js";

test("titleToSlug lowercases, hyphens spaces, strips other chars", () => {
  assert.equal(titleToSlug("Hello World!"), "hello-world");
  assert.equal(titleToSlug("A  B"), "a--b");
});

test("titleToSlug falls back for non-ASCII titles using unix seconds", () => {
  const now = new Date("2026-09-11T12:00:00+00:00");
  assert.equal(titleToSlug("中文标题", now), `untitled-${Math.floor(now.getTime() / 1000)}`);
});

test("localDateYmd uses local calendar date", () => {
  const now = new Date(2026, 8, 11, 15, 0, 0);
  assert.equal(localDateYmd(now), "2026-09-11");
});
