import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync, mkdtempSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { run } from "../../src/program.js";
import { physicalParent } from "../../src/services/node/node-layout.js";

function agents(local = "", descendants = ""): string {
  return `# Scope

<!-- edges-local:start -->
## 本层系统维护信息

${local}
<!-- edges-local:end -->

<!-- edges-descendants:start -->
## 下层系统维护信息

${descendants}
<!-- edges-descendants:end -->
`;
}

function put(root: string, rel: string, text: string): void {
  const file = path.join(root, rel);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, text);
}

function scope(t: test.TestContext, prefix: string): string {
  const root = mkdtempSync(path.join(realpathSync(tmpdir()), prefix));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

test("notes create with no README creates notes/README.md and lists the leaf there, not on AGENTS", async (t) => {
  const root = scope(t, "edges-note-org-");
  put(root, "AGENTS.md", agents(""));
  const created = await run(
    ["--scope", root, "notes", "create", "--title", "Fresh Note", "--body", "Body"],
    { env: {} },
  );
  assert.equal(created.exitCode, 0, created.stdout + created.stderr);
  const made = JSON.parse(created.stdout) as { path: string };
  const readme = readFileSync(path.join(root, "notes/README.md"), "utf8");
  assert.match(readme, /edges-entries-local:start/);
  assert.match(readme, /fresh-note\/INDEX\.md/);
  assert.doesNotMatch(readFileSync(path.join(root, "AGENTS.md"), "utf8"), /INDEX\.md|notes\/README\.md/);
  assert.equal(existsSync(path.join(root, "notes/AGENTS.md")), false);

  const listed = await run(["--scope", root, "notes", "list"], { env: {} });
  assert.equal(listed.exitCode, 0, listed.stdout + listed.stderr);
  assert.match(listed.stdout, /Fresh Note/);

  const removed = await run(["--scope", root, "notes", "delete", made.path], { env: {} });
  assert.equal(removed.exitCode, 0, removed.stdout + removed.stderr);
  assert.doesNotMatch(readFileSync(path.join(root, "notes/README.md"), "utf8"), /INDEX\.md/);
});

test("projects create with no README creates projects/README.md and does not register the leaf on AGENTS", async (t) => {
  const root = scope(t, "edges-project-org-");
  put(root, "AGENTS.md", agents(""));
  const created = await run(
    ["--scope", root, "projects", "create", "--title", "Fresh Project", "--body", "Body"],
    { env: {} },
  );
  assert.equal(created.exitCode, 0, created.stdout + created.stderr);
  const readme = readFileSync(path.join(root, "projects/README.md"), "utf8");
  assert.match(readme, /edges-entries-local:start/);
  assert.match(readme, /fresh-project\/INDEX\.md/);
  assert.doesNotMatch(readFileSync(path.join(root, "AGENTS.md"), "utf8"), /INDEX\.md|projects\/README\.md/);
  assert.equal(existsSync(path.join(root, "projects/AGENTS.md")), false);

  const listed = await run(["--scope", root, "projects", "list"], { env: {} });
  assert.equal(listed.exitCode, 0, listed.stdout + listed.stderr);
  assert.match(listed.stdout, /Fresh Project/);
});

test("prose notes/README beside notes/AGENTS gains entries and receives the new leaf", async (t) => {
  const root = scope(t, "edges-note-prose-");
  put(root, "AGENTS.md", agents("", "- [notes](notes/AGENTS.md) — notes"));
  put(root, "notes/AGENTS.md", agents(""));
  put(root, "notes/README.md", "# Notes\n\n待处理想法。公开散文保留。\n");
  const created = await run(
    ["--scope", root, "notes", "create", "--title", "Public Leaf", "--body", "Body"],
    { env: {} },
  );
  assert.equal(created.exitCode, 0, created.stdout + created.stderr);
  const readme = readFileSync(path.join(root, "notes/README.md"), "utf8");
  assert.match(readme, /待处理想法。公开散文保留。/);
  assert.match(readme, /edges-entries-local:start/);
  assert.match(readme, /public-leaf\/INDEX\.md/);
  assert.doesNotMatch(readFileSync(path.join(root, "notes/AGENTS.md"), "utf8"), /INDEX\.md/);
  assert.doesNotMatch(readFileSync(path.join(root, "AGENTS.md"), "utf8"), /INDEX\.md/);
});

test("physicalParent does not select AGENTS.md for a system-one note leaf", (t) => {
  const root = scope(t, "edges-parent-");
  put(root, "AGENTS.md", agents(""));
  put(root, "notes/AGENTS.md", agents(""));
  const leaf = path.join(root, "notes/2026-10-21--x/INDEX.md");
  assert.equal(physicalParent(leaf, root), undefined);
  put(
    root,
    "notes/README.md",
    "# Notes\n\n<!-- edges-entries-local:start -->\n## 本层内容\n\n<!-- edges-entries-local:end -->\n",
  );
  assert.equal(physicalParent(leaf, root), path.join(root, "notes/README.md"));
  assert.equal(
    physicalParent(path.join(root, ".edges/memory/projects/README.md"), root),
    path.join(root, "AGENTS.md"),
  );
});

test("notes init ensures the content-face org list and still keeps the harness placard", async (t) => {
  const root = scope(t, "edges-notes-init-face-");
  const result = await run(["--scope", root, "notes", "init"], { env: {} });
  assert.equal(result.exitCode, 0, result.stdout + result.stderr);
  const face = readFileSync(path.join(root, "notes/README.md"), "utf8");
  assert.match(face, /edges-entries-local:start/);
  assert.equal(existsSync(path.join(root, ".edges/notes/README.md")), true);
  assert.doesNotMatch(readFileSync(path.join(root, "AGENTS.md"), "utf8"), /\]\(<?notes\/README\.md>?\)/);
  const placard = readFileSync(path.join(root, ".edges/notes/README.md"), "utf8");
  assert.doesNotMatch(placard, /edges-entries-local:start/);
});
