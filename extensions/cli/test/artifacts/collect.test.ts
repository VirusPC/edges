import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, symlink, writeFile } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { collectPublishFiles } from "../../src/artifacts/utils/collect.js";

test("collectPublishFiles from a single file uses the basename", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "edges-artifacts-collect-"));
  const file = path.join(dir, "review.html");
  await writeFile(file, "<html>one</html>");
  const collected = await collectPublishFiles(file);
  assert.deepEqual(collected, [{ path: "review.html", content: "<html>one</html>" }]);
});

test("collectPublishFiles walks a directory and skips hidden files and symlinks", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "edges-artifacts-collect-"));
  await writeFile(path.join(dir, "index.html"), "<html>idx</html>");
  await mkdir(path.join(dir, "css"));
  await writeFile(path.join(dir, "css", "app.css"), "body{}");
  await writeFile(path.join(dir, ".secret"), "nope");
  await symlink("/etc/passwd", path.join(dir, "link.html"));
  const collected = await collectPublishFiles(dir);
  const paths = collected.map((file) => file.path).sort();
  assert.deepEqual(paths, ["css/app.css", "index.html"]);
});
