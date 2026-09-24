import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const assetDir = path.join(
  repoRoot,
  "extensions/clis/src/tasks/project/assets/review-page",
);

test("build:tasks-review-app emits index.html, review.js, and review.css only", () => {
  const built = spawnSync("pnpm", ["--filter", "tasks-review-app", "run", "build"], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  assert.equal(built.status, 0, built.stderr || built.stdout);
  assert.deepEqual(readdirSync(assetDir).sort(), ["index.html", "review.css", "review.js"]);
  const html = readFileSync(path.join(assetDir, "index.html"), "utf8");
  assert.match(html, /review\.js/);
  assert.match(html, /review\.css/);
  assert.match(html, /id="edges-review-payload"/);
  const js = readFileSync(path.join(assetDir, "review.js"), "utf8");
  assert.equal(js.includes("DEV-MOCK-STEM-NOT-IN-PROD"), false);
  const ignored = spawnSync("git", ["check-ignore", "-q", path.join(assetDir, "review.js")], {
    cwd: repoRoot,
  });
  assert.equal(ignored.status, 0);
});
