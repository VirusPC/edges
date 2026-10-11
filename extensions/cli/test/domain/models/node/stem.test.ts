import test from "node:test";
import assert from "node:assert/strict";
import { directoryStem } from "../../../../src/domain/models/node/stem.js";

test("directoryStem keeps CJK letters and digits", () => {
  assert.equal(directoryStem("中文标题"), "中文标题");
  assert.equal(directoryStem("版本2"), "版本2");
});

test("directoryStem keeps mixed CJK and Latin, and folds whitespace to the separator", () => {
  assert.equal(directoryStem("为 Edges CLI 建立 scope"), "为-Edges-CLI-建立-scope");
  assert.equal(directoryStem("Hello Note", { lowercase: true }), "hello-note");
  assert.equal(
    directoryStem("为 Edges CLI 建立 scope", { separator: "_", lowercase: true }),
    "为_edges_cli_建立_scope",
  );
  assert.equal(
    directoryStem("edges-cli 完整编译", { separator: "_", lowercase: true }),
    "edges_cli_完整编译",
  );
});

test("directoryStem strips path-hostile and filesystem-unsafe characters", () => {
  assert.equal(directoryStem("../"), "untitled");
  assert.equal(directoryStem("a/../b"), "ab");
  assert.equal(directoryStem(String.raw`a\b:c*d?e"f<g>h|i`), "abcdefghi");
  assert.equal(directoryStem("index.md"), "indexmd");
  assert.equal(directoryStem("edges_cli"), "edgescli");
});

test("directoryStem falls back when the title leaves nothing usable", () => {
  assert.equal(directoryStem(""), "untitled");
  assert.equal(directoryStem("???"), "untitled");
  assert.equal(directoryStem("---"), "untitled");
  assert.equal(directoryStem("../", { fallback: "task" }), "task");
});

test("directoryStem caps length only when asked, after cleanup", () => {
  assert.equal(directoryStem(`${"测".repeat(90)}`, { maxLength: 80 }), "测".repeat(80));
});
