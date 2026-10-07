import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { run } from "../../src/program.js";

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

function put(root: string, rel: string, text: string): void {
  const file = path.join(root, rel);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, text);
}

function scope(t: test.TestContext): string {
  const root = mkdtempSync(path.join(tmpdir(), "edges-projects-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

test("projects create get update delete and list go through a local leaf", async (t) => {
  const root = scope(t);
  put(root, "AGENTS.md", agents("", "- [projects](projects/AGENTS.md) — projects"));
  put(root, "projects/AGENTS.md", agents(""));
  const created = await run(
    ["--scope", root, "projects", "create", "--title", "Hello Project", "--body", "Body line", "--metadata", "custom=kept"],
    { env: {} },
  );
  assert.equal(created.exitCode, 0, created.stdout + created.stderr);
  const made = JSON.parse(created.stdout) as { command: string; path: string; title: string };
  assert.equal(made.command, "projects.create");
  assert.equal(made.title, "Hello Project");
  assert.match(made.path, /^projects\/\d{4}-\d{2}-\d{2}--hello-project\/INDEX\.md$/);
  assert.equal(existsSync(path.join(root, ".git")), false);
  const saved = readFileSync(path.join(root, made.path), "utf8");
  assert.match(saved, /^# Hello Project/m);
  assert.match(saved, /custom: kept/);
  assert.match(readFileSync(path.join(root, "projects/AGENTS.md"), "utf8"), /hello-project\/INDEX\.md/);

  const got = await run(["--scope", root, "projects", "get", made.path], { env: {} });
  assert.equal(got.exitCode, 0, got.stdout);
  assert.equal(JSON.parse(got.stdout).title, "Hello Project");
  assert.match(JSON.parse(got.stdout).body, /Body line/);

  const updated = await run(
    ["--scope", root, "projects", "update", made.path, "--title", "Next", "--body", "Updated", "--metadata", "custom=next"],
    { env: {} },
  );
  assert.equal(updated.exitCode, 0, updated.stdout);
  assert.match(readFileSync(path.join(root, made.path), "utf8"), /^# Next/m);
  assert.match(readFileSync(path.join(root, made.path), "utf8"), /Updated/);

  const listed = await run(
    ["--scope", root, "projects", "list", "--filter", "title=Next", "--group-by", "stem"],
    { env: {} },
  );
  assert.equal(listed.exitCode, 0, listed.stdout);
  const groups = JSON.parse(listed.stdout) as { command: string; groupBy: string; groups: Array<{ items: Array<{ title: string }> }> };
  assert.equal(groups.command, "projects.list");
  assert.equal(groups.groupBy, "stem");
  assert.equal(groups.groups[0]?.items[0]?.title, "Next");

  const removed = await run(["--scope", root, "projects", "delete", made.path], { env: {} });
  assert.equal(removed.exitCode, 0, removed.stdout);
  assert.equal(existsSync(path.join(root, made.path)), false);
  assert.doesNotMatch(readFileSync(path.join(root, "projects/AGENTS.md"), "utf8"), /hello-project\/INDEX\.md/);
});

test("projects help uses metadata and body and does not offer ingest", async () => {
  const help = await run(["projects", "--help"]);
  assert.equal(help.exitCode, 0);
  assert.match(help.stdout, /--body/);
  assert.match(help.stdout, /--metadata/);
  assert.match(help.stdout, /--filter/);
  assert.match(help.stdout, /--group-by/);
  assert.doesNotMatch(help.stdout, /--co-author|--import-entry|--dry-run|--mode|--content\b/);
});
