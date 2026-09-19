import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { assertSafeRelPath, isArtifactId, safeResolve } from "../src/paths.js";

test("accepts a nested relative file path", () => {
  assert.equal(assertSafeRelPath("index.html"), "index.html");
  assert.equal(assertSafeRelPath("css/app.css"), "css/app.css");
});

test("rejects traversal and absolute paths", () => {
  for (const rel of ["../secret", "foo/../../etc/passwd", "/etc/passwd", "a\\b", "foo/./../x"]) {
    assert.throws(() => assertSafeRelPath(rel), /relative POSIX|\.\.|empty segments|escapes/);
  }
});

test("isArtifactId accepts UUID and rejects junk", () => {
  assert.equal(isArtifactId("2c1d3e4f-5a6b-4c7d-8e9f-0123456789ab"), true);
  assert.equal(isArtifactId("not-a-uuid"), false);
  assert.equal(isArtifactId("2c1d3e4f-5a6b-4c7d-8e9f-0123456789ab/../x"), false);
});

test("safeResolve stays under root", () => {
  const root = "/tmp/edges-artifacts/id";
  assert.equal(safeResolve(root, "index.html"), path.join(root, "index.html"));
  assert.throws(() => safeResolve(root, "../x"), /escapes|relative|\.\./);
});
