import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, rmSync, writeFileSync, mkdtempSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { run } from "../../src/program.js";

function agents(descendants = ""): string {
  return `# Scope

<!-- edges-local:start -->
## 本层系统维护信息

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

test("notes and projects create keep Chinese characters in the dated directory stem", async (t) => {
  const root = mkdtempSync(path.join(realpathSync(tmpdir()), "edges-cjk-stem-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  put(root, "AGENTS.md", agents("- [notes](notes/AGENTS.md) — notes\n- [projects](projects/AGENTS.md) — projects"));
  put(root, "notes/AGENTS.md", agents());
  put(root, "projects/AGENTS.md", agents());

  const note = await run(
    ["--scope", root, "notes", "create", "--title", "中文标题", "--body", "正文"],
    { env: {} },
  );
  assert.equal(note.exitCode, 0, note.stdout + note.stderr);
  const noteMade = JSON.parse(note.stdout) as { path: string; title: string };
  assert.equal(noteMade.title, "中文标题");
  assert.match(noteMade.path, /^notes\/\d{4}-\d{2}-\d{2}--中文标题\/INDEX\.md$/);
  assert.equal(existsSync(path.join(root, noteMade.path)), true);

  const project = await run(
    ["--scope", root, "projects", "create", "--title", "中文标题", "--body", "正文"],
    { env: {} },
  );
  assert.equal(project.exitCode, 0, project.stdout + project.stderr);
  const projectMade = JSON.parse(project.stdout) as { path: string; title: string };
  assert.equal(projectMade.title, "中文标题");
  assert.match(projectMade.path, /^projects\/\d{4}-\d{2}-\d{2}--中文标题\/INDEX\.md$/);
  assert.equal(existsSync(path.join(root, projectMade.path)), true);
});

test("notes create shortens a long CJK title so the directory name fits", async (t) => {
  const root = mkdtempSync(path.join(realpathSync(tmpdir()), "edges-cjk-long-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  put(root, "AGENTS.md", agents("- [notes](notes/AGENTS.md) — notes"));
  put(root, "notes/AGENTS.md", agents());
  const title = "测".repeat(120);

  const note = await run(
    ["--scope", root, "notes", "create", "--title", title, "--body", "正文"],
    { env: {} },
  );
  assert.equal(note.exitCode, 0, note.stdout + note.stderr);
  const made = JSON.parse(note.stdout) as { path: string; title: string };
  assert.equal(made.title, title);
  const stem = made.path.split("/")[1] ?? "";
  assert.match(stem, /^\d{4}-\d{2}-\d{2}--测/);
  assert.ok(Buffer.byteLength(stem) <= 255);
  assert.equal(stem.endsWith("-"), false);
  assert.equal(existsSync(path.join(root, made.path)), true);
});
