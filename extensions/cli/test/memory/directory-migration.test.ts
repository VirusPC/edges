import test from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import {
  planDirectoryMigration,
  applyDirectoryMigration,
} from "../../../../scripts/migrate-directory-nodes.mjs";
function fixture(t: any) {
  const root = fs.realpathSync(
    fs.mkdtempSync(path.join(tmpdir(), "directory-migration-")),
  );
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  execFileSync("git", ["init", "-q"], { cwd: root });
  return root;
}
function put(root: string, file: string, source: string) {
  fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  fs.writeFileSync(path.join(root, file), source);
}
function track(root: string) {
  execFileSync("git", ["add", "."], { cwd: root });
}
const typeIndex =
  "<!-- project-memory-type:start -->\nname: project\nmodule: memory\nwritable: true\ngitignore: false\nformat: ordinary\n<!-- project-memory-type:end -->\n<!-- project-memory-entries:start -->\n- [Demo](project_demo.md#part) — Use\n<!-- project-memory-entries:end -->\n";
test("tracked public migration preserves resources and authored links, previews without mutation and reruns idempotently", (t) => {
  const root = fixture(t);
  put(root, ".harness/memory/projects/AGENTS.md", typeIndex);
  put(
    root,
    ".harness/memory/projects/project_demo.md",
    "---\nname: project_demo\ndescription: Use\n---\n# Demo\n![asset](project_demo/a%20b.png#x)\n[other](../../../../README.md?q#s)\n",
  );
  put(root, ".harness/memory/projects/project_demo/a b.png", "asset");
  put(
    root,
    "README.md",
    "Ordinary [keep](.harness/memory/projects/project_demo.md)",
  );
  track(root);
  const before = fs.readFileSync(
    path.join(root, ".harness/memory/projects/project_demo.md"),
    "utf8",
  );
  const plan = planDirectoryMigration(root);
  assert.deepEqual(
    plan.moves.map((x) => x.to),
    [path.join(root, ".harness/memory/projects/project_demo/index.md")],
  );
  assert.equal(fs.readFileSync(plan.moves[0]!.from, "utf8"), before);
  assert.equal(fs.existsSync(plan.moves[0]!.to), false);
  applyDirectoryMigration(plan);
  const saved = fs.readFileSync(plan.moves[0]!.to, "utf8");
  assert.match(saved, /!\[asset\]\(a%20b.png#x\)/);
  assert.match(saved, /\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/README.md\?q#s/);
  assert.match(
    fs.readFileSync(
      path.join(root, ".harness/memory/projects/AGENTS.md"),
      "utf8",
    ),
    /project_demo\/index.md#part/,
  );
  assert.equal(
    fs.readFileSync(path.join(root, "README.md"), "utf8"),
    "Ordinary [keep](.harness/memory/projects/project_demo.md)",
  );
  assert.equal(
    fs.readFileSync(
      path.join(root, ".harness/memory/projects/project_demo/a b.png"),
      "utf8",
    ),
    "asset",
  );
  assert.equal(planDirectoryMigration(root).moves.length, 0);
});
test("collision preflight preserves every source and index", (t) => {
  const root = fixture(t);
  put(root, ".harness/memory/projects/AGENTS.md", typeIndex);
  put(root, ".harness/memory/projects/project_demo.md", "# Original");
  put(root, ".harness/memory/projects/project_demo/index.md", "# Existing");
  track(root);
  assert.throws(() => planDirectoryMigration(root), /collision/i);
  assert.equal(
    fs.readFileSync(
      path.join(root, ".harness/memory/projects/project_demo.md"),
      "utf8",
    ),
    "# Original",
  );
});
test("private, untracked and other-system documents are excluded", (t) => {
  const root = fixture(t);
  for (const p of [
    "knowledge/posts/post.md",
    "docs/adr/0001.md",
    ".harness/memory/users/user_secret.md",
    ".agents/skills/installed/example.md",
    "thirdparty/notes/demo.md",
  ])
    put(root, p, "not YAML: [");
  put(root, "knowledge/notes/public.md", "# Public");
  track(root);
  put(root, "knowledge/notes/untracked.md", "# Untracked");
  const plan = planDirectoryMigration(root);
  assert.deepEqual(
    plan.moves.map((x) => path.relative(root, x.from)),
    ["knowledge/notes/public.md"],
  );
});
test("task sidecar moves explicitly but adjacent attachments retain their original targets", (t) => {
  const root = fixture(t);
  put(root, "tasks/_default/backlog/demo.md", "# Task\n![shared](asset.png)");
  put(root, "tasks/_default/backlog/.demo.log.md", "# Log");
  put(root, "tasks/_default/backlog/asset.png", "shared");
  track(root);
  const plan = planDirectoryMigration(root);
  applyDirectoryMigration(plan);
  assert.equal(
    fs.readFileSync(
      path.join(root, "tasks/_default/backlog/demo/.demo.log.md"),
      "utf8",
    ),
    "# Log",
  );
  assert.match(
    fs.readFileSync(
      path.join(root, "tasks/_default/backlog/demo/index.md"),
      "utf8",
    ),
    /\.\.\/asset.png/,
  );
  assert.equal(
    fs.existsSync(path.join(root, "tasks/_default/backlog/asset.png")),
    true,
  );
});
test("stale preview and legacy journal refuse before writes", (t) => {
  const root = fixture(t);
  put(root, "knowledge/notes/demo.md", "# Demo");
  track(root);
  const plan = planDirectoryMigration(root);
  put(root, "knowledge/notes/demo.md", "# Changed");
  assert.throws(() => applyDirectoryMigration(plan), /changed|stale/i);
  assert.equal(
    fs.existsSync(path.join(root, "knowledge/notes/demo/index.md")),
    false,
  );
  put(
    root,
    ".recursive-layout-migration/journal.json",
    "DO NOT READ PRIVATE SNAPSHOT",
  );
  assert.throws(
    () => planDirectoryMigration(root),
    /journal.json.*review|review.*journal.json/,
  );
});
test("nested note namespaces migrate while canonical-directory Markdown resources remain opaque", (t) => {
  const root = fixture(t);
  put(root, "knowledge/notes/memory/user-memory/example.md", "# Public topic");
  put(root, "knowledge/notes/kept/index.md", "# Existing");
  put(root, "knowledge/notes/kept/resource.md", "# Attachment");
  track(root);
  const plan = planDirectoryMigration(root);
  assert.deepEqual(
    plan.moves.map((x) => path.relative(root, x.from)),
    ["knowledge/notes/memory/user-memory/example.md"],
  );
});
for (const status of ["completed", "interrupted"])
  test(`refuses ${status}-looking legacy journal without parsing it`, (t) => {
    const root = fixture(t);
    put(
      root,
      ".recursive-layout-migration/journal.json",
      JSON.stringify({ status, privateSnapshot: "synthetic" }),
    );
    assert.throws(
      () => planDirectoryMigration(root),
      /journal.json.*manual review/,
    );
  });
test("same-stem symlink and ignored public-looking paths never become writable migration units", (t) => {
  const root = fixture(t);
  put(root, "knowledge/notes/demo.md", "# Demo");
  put(root, "outside/asset", "kept");
  track(root);
  fs.symlinkSync(
    path.join(root, "outside"),
    path.join(root, "knowledge/notes/demo"),
  );
  assert.throws(() => planDirectoryMigration(root), /symbolic/i);
  fs.unlinkSync(path.join(root, "knowledge/notes/demo"));
  put(root, ".gitignore", "knowledge/notes/demo.md\n");
  const plan = planDirectoryMigration(root);
  assert.equal(plan.moves.length, 0);
});
test("command defaults to dry-run and encoded registered note hrefs retain query and fragment", (t) => {
  const root = fixture(t);
  put(root, "knowledge/notes/topic/a b.md", "# Title");
  put(
    root,
    "AGENTS.md",
    "<!-- project-memory-local:start -->\n- [note](knowledge/notes/topic/a%20b.md?q=1#part) — Example\n<!-- project-memory-local:end -->",
  );
  track(root);
  const script = path.resolve(
    import.meta.dirname,
    "../../../../scripts/migrate-directory-nodes.mts",
  );
  const output = execFileSync(
    process.execPath,
    ["--import", "tsx", script, "--root", root],
    { encoding: "utf8" },
  );
  assert.equal(JSON.parse(output).mode, "dry-run");
  assert.equal(
    fs.existsSync(path.join(root, "knowledge/notes/topic/a b.md")),
    true,
  );
  applyDirectoryMigration(planDirectoryMigration(root));
  assert.match(
    fs.readFileSync(path.join(root, "AGENTS.md"), "utf8"),
    /a%20b\/index.md\?q=1#part/,
  );
});

test("nested scoped Note resources stay opaque while legacy topic notes migrate", (t) => {
  const root = fixture(t);
  const base = "projects/demo/knowledge/notes";
  put(root, base + "/kept/index.md", "# Existing Note");
  put(root, base + "/kept/resource.md", "# Opaque resource");
  put(root, base + "/topics/legacy.md", "# Legacy Note");
  track(root);
  const plan = planDirectoryMigration(root);
  assert.deepEqual(
    plan.moves.map((m) => path.relative(root, m.from)),
    [base + "/topics/legacy.md"],
  );
  applyDirectoryMigration(plan);
  assert.equal(
    fs.readFileSync(path.join(root, base, "kept/resource.md"), "utf8"),
    "# Opaque resource",
  );
  assert.equal(
    fs.existsSync(path.join(root, base, "topics/legacy/index.md")),
    true,
  );
});

test('current root notes namespace is converted while root posts remain protected', t => {
  const root = fixture(t);
  put(root, 'notes/topic/demo.md', '# Current note');
  put(root, 'posts/notes/private-post.md', '# Do not convert');
  track(root);
  const plan = planDirectoryMigration(root);
  assert.deepEqual(plan.moves.map(move => path.relative(root, move.from)), ['notes/topic/demo.md']);
  applyDirectoryMigration(plan);
  assert(fs.existsSync(path.join(root, 'notes/topic/demo/index.md')));
  assert.equal(fs.readFileSync(path.join(root, 'posts/notes/private-post.md'), 'utf8'), '# Do not convert');
});
