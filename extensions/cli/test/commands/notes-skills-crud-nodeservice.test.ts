import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { run } from "../../src/program.js";

const here = path.dirname(fileURLToPath(import.meta.url));

function agents(local: string, descendants = ""): string {
  return `# Scope

<!-- project-harness-local:start -->
## 本层系统维护信息

${local}
<!-- project-harness-local:end -->

<!-- project-harness-descendants:start -->
## 下层系统维护信息

${descendants}
<!-- project-harness-descendants:end -->
`;
}

function entriesReadme(title: string): string {
  return `# ${title}

<!-- project-entries-local:start -->
## 本层内容

<!-- project-entries-local:end -->
`;
}

function put(root: string, rel: string, text: string): void {
  const file = path.join(root, rel);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, text);
}

function scope(t: test.TestContext): string {
  const root = mkdtempSync(path.join(tmpdir(), "edges-crud-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

function readTree(dir: string): string {
  const out: string[] = [];
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, name.name);
    if (name.isDirectory()) out.push(readTree(abs));
    else if (name.name.endsWith(".ts")) out.push(readFileSync(abs, "utf8"));
  }
  return out.join("\n");
}

test("notes and skills commands do not keep a records or git ingest bypass", () => {
  const src = path.resolve(here, "../../src");
  assert.equal(existsSync(path.join(src, "services/note/records.ts")), false);
  assert.equal(existsSync(path.join(src, "services/skills/records.ts")), false);
  assert.equal(existsSync(path.join(src, "services/note/git/ingest.ts")), false);
  const notes = readTree(path.join(src, "commands/notes"));
  const skills = readTree(path.join(src, "commands/skills"));
  for (const source of [notes, skills]) {
    assert.doesNotMatch(source, /records/);
    assert.doesNotMatch(source, /readFileSync|writeFileSync|rmSync|readdirSync|readdir\(/);
    assert.doesNotMatch(source, /runNoteIngest|note\/git/);
  }
});

test("notes create get update delete and list go through a local leaf", async (t) => {
  const root = scope(t);
  put(root, "AGENTS.md", agents("", "- [notes](notes/AGENTS.md) — notes"));
  put(root, "notes/AGENTS.md", agents(""));
  const created = await run(
    ["--scope", root, "notes", "create", "--title", "Hello Note", "--body", "Body line", "--metadata", "custom=kept"],
    { env: {} },
  );
  assert.equal(created.exitCode, 0, created.stdout + created.stderr);
  const made = JSON.parse(created.stdout) as { command: string; path: string; title: string };
  assert.equal(made.command, "notes.create");
  assert.equal(made.title, "Hello Note");
  assert.match(made.path, /^notes\/\d{4}-\d{2}-\d{2}--hello-note\/INDEX\.md$/);
  assert.equal(existsSync(path.join(root, ".git")), false);
  const saved = readFileSync(path.join(root, made.path), "utf8");
  assert.match(saved, /^# Hello Note/m);
  assert.match(saved, /custom: kept/);
  assert.match(readFileSync(path.join(root, "notes/AGENTS.md"), "utf8"), /hello-note\/INDEX\.md/);

  const got = await run(["--scope", root, "notes", "get", made.path], { env: {} });
  assert.equal(got.exitCode, 0, got.stdout);
  assert.equal(JSON.parse(got.stdout).title, "Hello Note");

  const updated = await run(
    ["--scope", root, "notes", "update", made.path, "--title", "Next", "--metadata", "custom=next"],
    { env: {} },
  );
  assert.equal(updated.exitCode, 0, updated.stdout);
  assert.match(readFileSync(path.join(root, made.path), "utf8"), /^# Next/m);

  const listed = await run(
    ["--scope", root, "notes", "list", "--filter", "title=Next", "--group-by", "stem"],
    { env: {} },
  );
  assert.equal(listed.exitCode, 0, listed.stdout);
  const groups = JSON.parse(listed.stdout) as { groupBy: string; groups: Array<{ items: Array<{ title: string }> }> };
  assert.equal(groups.groupBy, "stem");
  assert.equal(groups.groups[0]?.items[0]?.title, "Next");

  const removed = await run(["--scope", root, "notes", "delete", made.path], { env: {} });
  assert.equal(removed.exitCode, 0, removed.stdout);
  assert.equal(existsSync(path.join(root, made.path)), false);
  assert.doesNotMatch(readFileSync(path.join(root, "notes/AGENTS.md"), "utf8"), /hello-note\/INDEX\.md/);
});

test("notes create registers on the parent README when it owns entries", async (t) => {
  const root = scope(t);
  put(root, "AGENTS.md", agents("", "- [notes](notes/AGENTS.md) — notes"));
  put(root, "notes/AGENTS.md", agents(""));
  put(root, "notes/README.md", entriesReadme("Notes"));
  const created = await run(
    ["--scope", root, "notes", "create", "--body", "# From H1\n\nText\n"],
    { env: {} },
  );
  assert.equal(created.exitCode, 0, created.stdout + created.stderr);
  const made = JSON.parse(created.stdout) as { path: string; title: string };
  assert.equal(made.title, "From H1");
  assert.match(readFileSync(path.join(root, "notes/README.md"), "utf8"), /INDEX\.md/);
  assert.doesNotMatch(readFileSync(path.join(root, "notes/AGENTS.md"), "utf8"), /INDEX\.md/);
  const removed = await run(["--scope", root, "notes", "delete", made.path], { env: {} });
  assert.equal(removed.exitCode, 0, removed.stdout);
  assert.doesNotMatch(readFileSync(path.join(root, "notes/README.md"), "utf8"), /INDEX\.md/);
});

test("notes create rejects removed ingest flags", async (t) => {
  const root = scope(t);
  put(root, "AGENTS.md", agents(""));
  const help = await run(["notes", "create", "--help"]);
  assert.equal(help.exitCode, 0);
  assert.match(help.stdout, /--body/);
  assert.match(help.stdout, /--title/);
  assert.doesNotMatch(help.stdout, /--co-author|--import-entry|--dry-run|--token-file|--token-stdin|--markdown/);
  assert.doesNotMatch(help.stdout, /--content\b|--mode\b/);
  for (const flag of ["--co-author", "--import-entry", "--dry-run", "--mode", "--content", "--token-file"]) {
    const result = await run(
      ["--scope", root, "notes", "create", "--title", "T", "--body", "b", flag, "x"],
      { env: {} },
    );
    assert.equal(result.exitCode, 2, flag + result.stdout);
    assert.equal(JSON.parse(result.stdout).errorCode, "VALIDATION_ERROR");
  }
});

test("skills create get update delete and list write skills/managed", async (t) => {
  const root = scope(t);
  put(root, "AGENTS.md", agents("- [managed](.harness/skills/managed/README.md) — managed skills"));
  put(root, ".harness/skills/managed/README.md", [
    "<!-- project-memory-type:start -->",
    "name: managed",
    "module: skills",
    "writable: true",
    "<!-- project-memory-type:end -->",
    "",
    entriesReadme("Skills"),
  ].join("\n"));
  const created = await run(
    ["--scope", root, "skills", "create", "demo-skill", "--description", "A demo skill", "--body", "Do the thing"],
    { env: {} },
  );
  assert.equal(created.exitCode, 0, created.stdout + created.stderr);
  const made = JSON.parse(created.stdout) as { path: string; name: string };
  assert.equal(made.name, "demo-skill");
  assert.equal(made.path, ".harness/skills/managed/demo-skill/SKILL.md");
  assert.match(readFileSync(path.join(root, made.path), "utf8"), /name: demo-skill/);
  assert.match(readFileSync(path.join(root, ".harness/skills/managed/README.md"), "utf8"), /demo-skill\/SKILL\.md/);

  const got = await run(["--scope", root, "skills", "get", "demo-skill"], { env: {} });
  assert.equal(got.exitCode, 0, got.stdout);
  assert.equal(JSON.parse(got.stdout).description, "A demo skill");

  const updated = await run(
    ["--scope", root, "skills", "update", "demo-skill", "--description", "Updated", "--body", "New steps"],
    { env: {} },
  );
  assert.equal(updated.exitCode, 0, updated.stdout);
  assert.match(readFileSync(path.join(root, made.path), "utf8"), /description: Updated/);

  const listed = await run(
    ["--scope", root, "skills", "list", "--filter", "name=demo-skill", "--group-by", "name"],
    { env: {} },
  );
  assert.equal(listed.exitCode, 0, listed.stdout);
  const groups = JSON.parse(listed.stdout) as { groups: Array<{ key: string }> };
  assert.equal(groups.groups[0]?.key, "demo-skill");

  const removed = await run(["--scope", root, "skills", "delete", "demo-skill"], { env: {} });
  assert.equal(removed.exitCode, 0, removed.stdout);
  assert.equal(existsSync(path.join(root, made.path)), false);
  assert.doesNotMatch(readFileSync(path.join(root, ".harness/skills/managed/README.md"), "utf8"), /demo-skill\/SKILL\.md/);
});

test("skill get by a repeated name is ambiguous", async (t) => {
  const root = scope(t);
  put(root, "AGENTS.md", agents("- [managed](.harness/skills/managed/README.md) — managed skills"));
  const skill = "---\nname: demo-skill\ndescription: One\n---\nBody\n";
  put(root, ".harness/skills/managed/README.md", [
    "<!-- project-memory-type:start -->",
    "name: managed",
    "module: skills",
    "writable: true",
    "<!-- project-memory-type:end -->",
    "",
    "# Skills",
    "",
    "<!-- project-entries-local:start -->",
    "## 本层内容",
    "",
    "- [demo-skill](demo-skill/SKILL.md) — One",
    "- [other](other/SKILL.md) — One",
    "<!-- project-entries-local:end -->",
    "",
  ].join("\n"));
  put(root, ".harness/skills/managed/demo-skill/SKILL.md", skill);
  put(root, ".harness/skills/managed/other/SKILL.md", skill);
  const result = await run(["--scope", root, "skills", "get", "demo-skill"], { env: {} });
  assert.equal(result.exitCode, 2, result.stdout);
  assert.match(JSON.parse(result.stdout).reason, /ambiguous/);
});
