import test, { type TestContext } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import {
  planTopLevelLayout,
  applyTopLevelLayout,
} from "../../../../scripts/flatten-content-layout.mjs";
function fixture(t: TestContext) {
  const root = fs.realpathSync(
    fs.mkdtempSync(path.join(tmpdir(), "top-level-layout-")),
  );
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  execFileSync("git", ["init", "-q"], { cwd: root });
  return root;
}
function put(root: string, file: string, source: string | Buffer) {
  fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  fs.writeFileSync(path.join(root, file), source);
}
function track(root: string) {
  execFileSync("git", ["add", "."], { cwd: root });
}
test("preview and apply flatten content and apps, preserving resources, post bytes and resolved relative links", (t) => {
  const root = fixture(t);
  put(root, "README.md", "[note](knowledge/notes/topic/index.md?q#part)\n");
  put(
    root,
    "knowledge/notes/topic/index.md",
    "[root](../../../README.md)\n![image](../../resources/a%20b.png#s)\n[near](local.png)\n",
  );
  put(root, "knowledge/notes/topic/local.png", Buffer.from([0, 1, 255]));
  put(root, "knowledge/resources/a b.png", Buffer.from([9, 8, 0]));
  put(root, "knowledge/posts/post.md", "Original `knowledge/posts/` prose\n");
  put(root, "apps/demo/README.md", "[root](../../README.md)\n");
  track(root);
  const plan = planTopLevelLayout(root);
  assert(fs.existsSync(path.join(root, "knowledge/notes/topic/index.md")));
  assert(!fs.existsSync(path.join(root, "notes")));
  applyTopLevelLayout(plan);
  assert.equal(
    fs.readFileSync(path.join(root, "README.md"), "utf8"),
    "[note](notes/topic/index.md?q#part)\n",
  );
  assert.equal(
    fs.readFileSync(path.join(root, "notes/topic/index.md"), "utf8"),
    "[root](../../README.md)\n![image](../../resources/a%20b.png#s)\n[near](local.png)\n",
  );
  assert.equal(
    fs.readFileSync(path.join(root, "extensions/apps/demo/README.md"), "utf8"),
    "[root](../../../README.md)\n",
  );
  assert.deepEqual(
    fs.readFileSync(path.join(root, "notes/topic/local.png")),
    Buffer.from([0, 1, 255]),
  );
  assert.equal(
    fs.readFileSync(path.join(root, "posts/post.md"), "utf8"),
    "Original `knowledge/posts/` prose\n",
  );
  assert(!fs.existsSync(path.join(root, "knowledge")));
  assert(!fs.existsSync(path.join(root, "apps")));
  assert.equal(planTopLevelLayout(root).moves.length, 0);
  assert.equal(planTopLevelLayout(root).edits.length, 0);
});
test("destination collisions reject the entire plan before moving any directory", (t) => {
  const root = fixture(t);
  put(root, "knowledge/notes/a.md", "# old");
  put(root, "notes/keep.md", "# existing");
  put(root, "apps/demo/README.md", "# app");
  track(root);
  assert.throws(() => planTopLevelLayout(root), /collision/i);
  assert(fs.existsSync(path.join(root, "apps/demo/README.md")));
  assert.equal(
    fs.readFileSync(path.join(root, "notes/keep.md"), "utf8"),
    "# existing",
  );
});
test("stale source snapshots reject apply before directory moves", (t) => {
  const root = fixture(t);
  put(root, "knowledge/notes/README.md", "[root](../../README.md)");
  put(root, "README.md", "# root");
  track(root);
  const plan = planTopLevelLayout(root);
  put(root, "knowledge/notes/README.md", "# later edit");
  assert.throws(() => applyTopLevelLayout(plan), /changed|stale/i);
  assert(!fs.existsSync(path.join(root, "notes")));
});
test("ignored memory is carried unchanged without rewriting and historical migration manifests retain old paths", (t) => {
  const root = fixture(t);
  put(root, ".gitignore", "**/.harness/memory/users/\n");
  put(root, "knowledge/notes/README.md", "# Notes");
  put(
    root,
    "knowledge/notes/.harness/memory/users/private.md",
    "[root](../../../../../README.md)",
  );
  put(
    root,
    "docs/superpowers/plans/history.json",
    '{"source":"knowledge/notes/a.md"}',
  );
  track(root);
  applyTopLevelLayout(planTopLevelLayout(root));
  assert.equal(
    fs.readFileSync(
      path.join(root, "notes/.harness/memory/users/private.md"),
      "utf8",
    ),
    "[root](../../../../../README.md)",
  );
  assert.equal(
    fs.readFileSync(
      path.join(root, "docs/superpowers/plans/history.json"),
      "utf8",
    ),
    '{"source":"knowledge/notes/a.md"}',
  );
});
test("symlinked content directories are rejected without following their targets", (t) => {
  const root = fixture(t);
  put(root, "outside/README.md", "# untouched");
  fs.mkdirSync(path.join(root, "knowledge"));
  fs.symlinkSync("../outside", path.join(root, "knowledge/notes"));
  track(root);
  assert.throws(() => planTopLevelLayout(root), /symlink/i);
  assert.equal(
    fs.readFileSync(path.join(root, "outside/README.md"), "utf8"),
    "# untouched",
  );
});

test("reruns preserve current extension-relative app links and memory index descriptions", (t) => {
  const root = fixture(t);
  put(root, "extensions/README.md", "[app](apps/demo/README.md)\n");
  put(root, "extensions/apps/demo/README.md", "# app\n");
  put(
    root,
    ".harness/memory/projects/AGENTS.md",
    "- [history](old/index.md) — Historical knowledge/notes/ scope.\n",
  );
  track(root);
  assert.equal(planTopLevelLayout(root).edits.length, 0);
});

test("migrated workspace keeps a frozen-installable lockfile without dependency resolution", (t) => {
  const root = fixture(t);
  put(root, "package.json", JSON.stringify({ name: "fixture", private: true }));
  put(
    root,
    "pnpm-workspace.yaml",
    "packages:\n  - 'apps/*'\n  - 'extensions/cli'\n",
  );
  put(
    root,
    "apps/tasks-review-app/package.json",
    JSON.stringify({
      name: "tasks-review-app",
      version: "1.0.0",
      dependencies: { react: "19.2.8" },
    }),
  );
  put(
    root,
    "extensions/cli/package.json",
    JSON.stringify({
      name: "cli",
      version: "1.0.0",
      devDependencies: { "tasks-review-app": "workspace:*" },
    }),
  );
  put(
    root,
    "pnpm-lock.yaml",
    "lockfileVersion: '9.0'\nsettings:\n  autoInstallPeers: true\n  excludeLinksFromLockfile: false\nimporters:\n  .: {}\n  apps/tasks-review-app:\n    dependencies:\n      react:\n        specifier: 19.2.8\n        version: 19.2.8\n  extensions/cli:\n    devDependencies:\n      tasks-review-app:\n        specifier: workspace:*\n        version: link:../../apps/tasks-review-app\n",
  );
  track(root);
  applyTopLevelLayout(planTopLevelLayout(root));
  execFileSync(
    "pnpm",
    [
      "install",
      "--lockfile-only",
      "--frozen-lockfile",
      "--ignore-scripts",
      "--offline",
    ],
    { cwd: root, stdio: "pipe" },
  );
  const link = fs
    .readFileSync(path.join(root, "pnpm-lock.yaml"), "utf8")
    .match(/version: link:(.+)/)?.[1];
  assert(link);
  assert(
    fs.existsSync(path.resolve(root, "extensions/cli", link, "package.json")),
  );
  assert.equal(planTopLevelLayout(root).edits.length, 0);
  assert.equal(planTopLevelLayout(root).moves.length, 0);
});
