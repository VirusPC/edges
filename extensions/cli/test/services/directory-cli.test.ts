import test from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { run } from "../../src/program.js";
import { initMemory } from "../../src/services/memory/init.js";
function fixture(t: any) {
  const root = fs.realpathSync(
    fs.mkdtempSync(path.join(tmpdir(), "directory-cli-")),
  );
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}
function put(file: string, content: string) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}
test("Task directory create/get/update/status/project keep assets and runlog together", async (t) => {
  const root = fixture(t);
  put(path.join(root, "AGENTS.md"), "# Scope");
  const call = (args: string[]) =>
    run(["--scope", root, "tasks", "--index-group", "local", ...args], { env: {} });
  const made = await call(["create", "--title", "Unit"]);
  assert.equal(made.exitCode, 0, made.stdout);
  const item = JSON.parse(made.stdout);
  assert.match(item.path, /\/index.md$/);
  assert.equal(path.dirname(item.sidecarPath), path.dirname(item.path));
  put(path.join(root, path.dirname(item.path), "image.png"), "asset");
  put(path.join(root, path.dirname(item.path), "resource.md"), "not a task");
  const get = await call(["get", item.path]);
  assert.equal(get.exitCode, 0, get.stdout);
  const list = await call(["list"]);
  assert.equal(list.exitCode, 0, list.stdout);
  assert.equal(JSON.parse(list.stdout).tasks.length, 1);
  const moved = await call(["status", item.stem, "done"]);
  assert.equal(moved.exitCode, 0, moved.stdout);
  const done = JSON.parse(moved.stdout);
  assert.equal(
    fs.readFileSync(
      path.join(root, path.dirname(done.path), "image.png"),
      "utf8",
    ),
    "asset",
  );
  assert.equal(fs.existsSync(path.join(root, item.path)), false);
  const changed = await call(["update", item.stem, "--project", "resources"]);
  assert.equal(changed.exitCode, 0, changed.stdout);
  const changedItem = JSON.parse(changed.stdout);
  assert.match(changedItem.path, /resources\/done\/.*\/index.md$/);
  assert.equal(
    fs.existsSync(
      path.join(
        root,
        path.dirname(changedItem.path),
        path.basename(item.sidecarPath),
      ),
    ),
    true,
  );
});
test("Memory directory format indexes only entry, updates by same slug and doctor sees actual entry", async (t) => {
  const root = fixture(t);
  await initMemory({ indexGroup: "descendant", targetDir: root, memoryTypes: ["project"] });
  const source = path.join(root, "selected");
  put(path.join(source, "image.png"), "image");
  put(path.join(source, "details.md"), "resource");
  put(
    path.join(source, "index.md"),
    "---\nname: project_unit\ndescription: Owned\nmetadata:\n  edges-title: Unit\n  edges-type: project\n---\n![image](image.png)",
  );
  const call = (args: string[]) =>
    run(["--scope", root, "memory", ...args], { env: {} });
  const made = await call([
    "remember",
    "--type",
    "project",
    "--slug",
    "unit",
    "--import-entry",
    path.join(source, "index.md"),
  ]);
  assert.equal(made.exitCode, 0, made.stdout);
  const result = JSON.parse(made.stdout);
  assert.match(result.path, /project_unit\/index.md$/);
  assert.equal(
    fs.readFileSync(
      path.join(root, path.dirname(result.path), "image.png"),
      "utf8",
    ),
    "image",
  );
  assert.match(
    fs.readFileSync(path.join(root, result.index), "utf8"),
    /project_unit\/index.md/,
  );
  assert.doesNotMatch(
    fs.readFileSync(path.join(root, result.index), "utf8"),
    /details.md/,
  );
  const updated = await call([
    "remember",
    "--type",
    "project",
    "--slug",
    "unit",
    "--content",
    "Updated",
  ]);
  assert.equal(updated.exitCode, 0, updated.stdout);
  assert.equal(JSON.parse(updated.stdout).path, result.path);
  assert.equal(
    fs.existsSync(path.join(root, ".harness/memory/projects/project_unit.md")),
    false,
  );
  const doctor = await call(["doctor"]);
  assert.equal(doctor.exitCode, 0, doctor.stdout);
});
test("Note CLI preserves authored Markdown and commits only its explicit owned resource directory", async (t) => {
  const { execFileSync } = await import("node:child_process");
  const root = fixture(t);
  const git = (...args: string[]) =>
    execFileSync("git", args, { cwd: root, encoding: "utf8" });
  git("init", "-b", "main");
  git("config", "user.name", "Test");
  git("config", "user.email", "test@example.test");
  put(path.join(root, "AGENTS.md"), "# Scope");
  git("add", "AGENTS.md");
  git("commit", "-m", "init");
  const source = path.join(root, "selected");
  put(path.join(source, "photo.bin"), "asset");
  const document =
    '---\ncustom: "keep this exact formatting"\n---\n# Authored title\n\n![photo](photo.bin)\n\n';
  const input = path.join(source, "index.md");
  put(input, document);
  const result = await run(
    [
      "--scope",
      root,
      "note", "--index-group", "local",
      "--title",
      "Filename title",
      "--import-entry",
      input,
      "--co-author",
      "Codex <noreply@openai.com>",
      "--dry-run",
    ],
    { env: { EDGES_MODE: "direct", EDGES_BASE_BRANCH: "main" } },
  );
  assert.equal(result.exitCode, 0, result.stdout);
  const created = JSON.parse(result.stdout);
  assert.match(created.filePath, /--filename-title\/index.md$/);
  const saved = fs.readFileSync(path.join(root, created.filePath), "utf8");
  const { NoteNode } = await import("../../src/domain/models/note-node.js");
  const note = new NoteNode(path.join(root, created.filePath)).parse(saved);
  assert.equal(note.metadata?.custom, "keep this exact formatting");
  assert.equal(note.title, "Authored title");
  assert.equal(note.body, "# Authored title\n\n![photo](photo.bin)\n\n");
  assert.doesNotMatch(saved, /Ingested on|# Filename title/);
  const tracked = git("show", "--pretty=format:", "--name-only", "HEAD");
  assert.match(tracked, /photo.bin/);
  assert.doesNotMatch(tracked, /selected|authored.md/);
});
test("Task directory status refuses same-stem standalone destination and preserves unrelated siblings", async (t) => {
  const root = fixture(t);
  put(path.join(root, "AGENTS.md"), "# Scope");
  const call = (args: string[]) =>
    run(["--scope", root, "tasks", "--index-group", "local", "--purpose", "domain", ...args], { env: {} });
  const result = await call(["create", "--title", "Collision"]);
  assert.equal(result.exitCode, 0, result.stdout);
  const item = JSON.parse(result.stdout);
  const collision = path.join(root, "tasks/_default/done", item.stem + ".md");
  put(collision, "# Independent");
  put(path.join(root, "tasks/_default/backlog/sibling.md"), "# Sibling");
  const move = await call(["status", item.path, "done"]);
  assert.notEqual(move.exitCode, 0);
  assert.equal(fs.existsSync(path.join(root, item.path)), true);
  assert.equal(fs.readFileSync(collision, "utf8"), "# Independent");
  assert.equal(
    fs.readFileSync(
      path.join(root, "tasks/_default/backlog/sibling.md"),
      "utf8",
    ),
    "# Sibling",
  );
});
test("private Memory directory entries stay ignored", async (t) => {
  const { execFileSync } = await import("node:child_process");
  const root = fixture(t);
  execFileSync("git", ["init", "-q"], { cwd: root });
  await initMemory({ indexGroup: "descendant", targetDir: root, memoryTypes: ["user"] });
  const made = await run(
    [
      "--scope",
      root,
      "memory",
      "remember",
      "--type",
      "user",
      "--slug",
      "private",
      "--title",
      "Private",
      "--description",
      "Synthetic",
      "--content",
      "Synthetic private body",
    ],
    { env: {} },
  );
  assert.equal(made.exitCode, 0, made.stdout);
  const entry = path.join(root, JSON.parse(made.stdout).path);
  execFileSync("git", ["check-ignore", "-q", "--", entry], { cwd: root });
});
test("Skill type enumeration ignores resource recovery directories", async (t) => {
  const root = fixture(t);
  await initMemory({ indexGroup: "descendant", targetDir: root, skillTypes: ["managed"] });
  put(
    path.join(root, ".harness/skills/managed/kept/SKILL.md"),
    "---\nname: kept\ndescription: Kept\n---\nBody",
  );
  put(
    path.join(root, ".harness/skills/managed/.node-recovery-example/SKILL.md"),
    "---\nname: recovered\ndescription: Recovery only\n---\nBody",
  );
  const { buildEntryIndex } =
    await import("../../src/services/memory/entries.js");
  const index = buildEntryIndex(root, "managed");
  assert.match(index, /kept\/SKILL.md/);
  assert.doesNotMatch(index, /recovery-example|recovered/);
});
test("Skill import validates full fields before writing and preserves its source", async (t) => {
  const root = fixture(t);
  await initMemory({ indexGroup: "descendant", targetDir: root, skillTypes: ["managed"] });
  const source = path.join(root, "source/SKILL.md");
  put(source, "# Invalid skill");
  const result = await run(
    [
      "--scope",
      root,
      "memory",
      "remember",
      "--type",
      "managed",
      "--slug",
      "example",
      "--import-entry",
      source,
    ],
    { env: {} },
  );
  assert.notEqual(result.exitCode, 0);
  assert.match(result.stdout, /SKILL.md.*name/);
  assert.equal(
    fs.existsSync(path.join(root, ".harness/skills/managed/example")),
    false,
  );
  assert.equal(fs.readFileSync(source, "utf8"), "# Invalid skill");
});
test("Memory and Note reject conflicting import content and wrong entry types before writing", async (t) => {
  const root = fixture(t);
  await initMemory({ indexGroup: "descendant", targetDir: root, memoryTypes: ["project"] });
  const source = path.join(root, "source/SKILL.md");
  put(source, "---\nname: example\ndescription: Example\n---\nBody");
  const conflict = await run(
    [
      "--scope",
      root,
      "memory",
      "remember",
      "--type",
      "project",
      "--slug",
      "example",
      "--import-entry",
      source,
      "--content",
      "Other",
    ],
    { env: {} },
  );
  assert.notEqual(conflict.exitCode, 0);
  assert.match(conflict.stdout, /conflict|cannot/i);
  const wrong = await run(
    [
      "--scope",
      root,
      "memory",
      "remember",
      "--type",
      "project",
      "--slug",
      "example",
      "--import-entry",
      source,
    ],
    { env: {} },
  );
  assert.notEqual(wrong.exitCode, 0);
  assert.match(wrong.stdout, /expected index.md/);
  assert.equal(
    fs.existsSync(path.join(root, ".harness/memory/projects/project_example")),
    false,
  );
});
test("Note import commits its parent registration and keeps source bytes unchanged", async (t) => {
  const { execFileSync } = await import("node:child_process");
  const root = fixture(t),
    git = (...args: string[]) =>
      execFileSync("git", args, { cwd: root, encoding: "utf8" });
  git("init", "-b", "main");
  git("config", "user.name", "Test");
  git("config", "user.email", "test@example.test");
  put(path.join(root, "AGENTS.md"), "# Root");
  put(path.join(root, "notes/AGENTS.md"), "# Notes");
  git("add", ".");
  git("commit", "-m", "init");
  const source = path.join(root, "source/index.md"),
    original = "---\ncustom: keep\n---\n# Authored\n\nExtra prose\n";
  put(source, original);
  put(path.join(root, "source/asset"), "bytes");
  const result = await run(
    [
      "--scope",
      root,
      "note", "--index-group", "local",
      "--title",
      "Imported",
      "--import-entry",
      source,
      "--co-author",
      "Codex <noreply@openai.com>",
      "--dry-run",
    ],
    { env: { EDGES_MODE: "direct" } },
  );
  assert.equal(result.exitCode, 0, result.stdout);
  assert.equal(fs.readFileSync(source, "utf8"), original);
  assert.match(
    git("show", "--pretty=format:", "--name-only", "HEAD"),
    /notes\/AGENTS.md/,
  );
  assert.equal(git("diff", "--name-only").trim(), "");
});
test("business imports reject known source directory types instead of silently retyping them", async (t) => {
  const root = fixture(t);
  await initMemory({ indexGroup: "descendant", targetDir: root, memoryTypes: ["project"] });
  const source = path.join(root, "tasks/_default/backlog/task/index.md");
  put(source, "# Task");
  const result = await run(
    [
      "--scope",
      root,
      "memory",
      "remember",
      "--type",
      "project",
      "--slug",
      "wrong",
      "--import-entry",
      source,
    ],
    { env: {} },
  );
  assert.notEqual(result.exitCode, 0);
  assert.match(result.stdout, /type.*task|task.*type/);
  assert.equal(
    fs.existsSync(path.join(root, ".harness/memory/projects/project_wrong")),
    false,
  );
});
test("doctor reports legacy memory migration without erasing the existing index", async (t) => {
  const root = fixture(t);
  await initMemory({ indexGroup: "descendant", targetDir: root, memoryTypes: ["project"] });
  const index = path.join(root, ".harness/memory/projects/AGENTS.md");
  const original = fs
    .readFileSync(index, "utf8")
    .replace("- 暂无条目。", "- [Old](project_old.md) — Legacy");
  put(index, original);
  put(
    path.join(root, ".harness/memory/projects/project_old.md"),
    "---\ndescription: Legacy\n---\nOld",
  );
  const result = await run(["--scope", root, "memory", "doctor", "--apply"], {
    env: {},
  });
  assert.match(result.stdout, /migration-required/);
  assert.equal(fs.readFileSync(index, "utf8"), original);
});
test("Note Markdown file input preserves extras without copying neighbors and invalid metadata writes nothing", async (t) => {
  const { execFileSync } = await import("node:child_process");
  const root = fixture(t),
    git = (...args: string[]) =>
      execFileSync("git", args, { cwd: root, encoding: "utf8" });
  git("init", "-b", "main");
  git("config", "user.name", "Test");
  git("config", "user.email", "test@example.test");
  put(path.join(root, "AGENTS.md"), "# Root");
  git("add", ".");
  git("commit", "-m", "init");
  const source = path.join(root, "source/document.md"),
    original = "---\ncustom: keep\n---\n# Title\n\n## Extra\nKeep this\n";
  put(source, original);
  put(path.join(root, "source/unrelated.txt"), "neighbor");
  const call = (title: string) =>
    run(
      [
        "--scope",
        root,
        "note", "--index-group", "local",
        "--title",
        title,
        "--content-file",
        source,
        "--markdown",
        "--co-author",
        "Codex <noreply@openai.com>",
        "--dry-run",
      ],
      { env: { EDGES_MODE: "direct" } },
    );
  const result = await call("Document");
  assert.equal(result.exitCode, 0, result.stdout);
  const file = JSON.parse(result.stdout).filePath;
  assert.match(
    fs.readFileSync(path.join(root, file), "utf8"),
    /## Extra\nKeep this/,
  );
  assert.equal(
    fs.existsSync(path.join(root, path.dirname(file), "unrelated.txt")),
    false,
  );
  assert.equal(fs.readFileSync(source, "utf8"), original);
  const head = git("rev-parse", "HEAD");
  put(source, "---\ndescription: [invalid]\n---\n# Bad");
  const invalid = await call("Invalid");
  assert.notEqual(invalid.exitCode, 0);
  assert.match(invalid.stdout, /index.md.*description/);
  assert.equal(git("rev-parse", "HEAD"), head);
  assert.equal(fs.readdirSync(path.join(root, "notes")).length, 1);
});
