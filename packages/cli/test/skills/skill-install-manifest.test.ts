import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  OFFICIAL_BUNDLED_SKILLS,
  SKILL_INSTALL_MANIFEST,
  applyEdgesSkillCleanup,
  formatSkillCleanup,
  hashSkillDir,
} from "../../src/services/skills/skill-install-manifest.js";

async function rootOf(t: test.TestContext): Promise<string> {
  const cwd = await mkdtemp(path.join(tmpdir(), "edges-skill-cleanup-"));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  const root = path.join(cwd, ".agents", "skills");
  mkdirSync(root, { recursive: true });
  return root;
}

function skill(root: string, name: string, body: string): string {
  const dir = path.join(root, name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, "SKILL.md"), body);
  return dir;
}

test("an unchanged manifest entry that is no longer bundled is deleted and listed", async (t) => {
  const root = await rootOf(t);
  const dir = skill(root, "edges-memory-ask", "official\n");
  const hash = hashSkillDir(dir);
  writeFileSync(
    path.join(root, SKILL_INSTALL_MANIFEST),
    JSON.stringify({ version: 1, skills: { "edges-memory-ask": { hash }, edges: { hash: "stay" } } }),
  );
  skill(root, "edges", "current\n");
  const actions = applyEdgesSkillCleanup(root, { cwd: path.dirname(path.dirname(root)) });
  assert.equal(existsSync(dir), false);
  assert.equal(existsSync(path.join(root, "edges")), true);
  assert.match(formatSkillCleanup(actions, false), /removed edges-installed skill edges-memory-ask/);
  const manifest = JSON.parse(readFileSync(path.join(root, SKILL_INSTALL_MANIFEST), "utf8")) as {
    skills: Record<string, { hash: string }>;
  };
  assert.equal(manifest.skills["edges-memory-ask"], undefined);
  assert.equal(manifest.skills.edges?.hash, hashSkillDir(path.join(root, "edges")));
});

test("a modified manifest entry is kept and the warning tells how to remove it", async (t) => {
  const root = await rootOf(t);
  const dir = skill(root, "edges-create-notes", "official\n");
  writeFileSync(
    path.join(root, SKILL_INSTALL_MANIFEST),
    JSON.stringify({ version: 1, skills: { "edges-create-notes": { hash: hashSkillDir(dir) } } }),
  );
  writeFileSync(path.join(dir, "SKILL.md"), "user edited\n");
  const actions = applyEdgesSkillCleanup(root, { cwd: path.dirname(path.dirname(root)) });
  assert.equal(existsSync(dir), true);
  const text = formatSkillCleanup(actions, false);
  assert.match(text, /contents changed/);
  assert.match(text, new RegExp(dir.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("without a manifest, a retired skill matching a published hash is deleted and a changed one is only warned", async (t) => {
  const root = await rootOf(t);
  const cwd = path.dirname(path.dirname(root));
  const same = skill(root, "edges-memory-ask", "published\n");
  const changed = skill(root, "edges-memory-remember", "local edit\n");
  const publishedHashes = {
    "edges-memory-ask": [hashSkillDir(same)],
    "edges-memory-remember": ["not-this-hash"],
  };
  const actions = applyEdgesSkillCleanup(root, { cwd, publishedHashes });
  assert.equal(existsSync(same), false);
  assert.equal(existsSync(changed), true);
  const text = formatSkillCleanup(actions, false);
  assert.match(text, /removed edges-installed skill edges-memory-ask/);
  assert.match(text, /edges-memory-remember was installed by edges but its contents changed/);
});

test("dry-run lists a removal and does not delete or write a manifest", async (t) => {
  const root = await rootOf(t);
  const dir = skill(root, "edges-tasks-classify", "published\n");
  const actions = applyEdgesSkillCleanup(root, {
    cwd: path.dirname(path.dirname(root)),
    dryRun: true,
    publishedHashes: { "edges-tasks-classify": [hashSkillDir(dir)] },
  });
  assert.equal(existsSync(dir), true);
  assert.equal(existsSync(path.join(root, SKILL_INSTALL_MANIFEST)), false);
  assert.match(formatSkillCleanup(actions, true), /dry-run: would remove edges-installed skill edges-tasks-classify/);
});

test("directories outside the manifest and the retired list are left alone, and a symlink to a removed skill is removed", async (t) => {
  const root = await rootOf(t);
  const cwd = path.dirname(path.dirname(root));
  const unrelated = skill(root, "my-notes", "keep\n");
  const retired = skill(root, "edges-create-tasks", "published\n");
  const linkDir = path.join(cwd, ".claude", "skills");
  mkdirSync(linkDir, { recursive: true });
  symlinkSync(retired, path.join(linkDir, "edges-create-tasks"));
  const actions = applyEdgesSkillCleanup(root, {
    cwd,
    publishedHashes: { "edges-create-tasks": [hashSkillDir(retired)] },
  });
  assert.equal(existsSync(unrelated), true);
  assert.equal(existsSync(retired), false);
  assert.equal(existsSync(path.join(linkDir, "edges-create-tasks")), false);
  assert.match(formatSkillCleanup(actions, false), /removed symlink/);
  for (const name of OFFICIAL_BUNDLED_SKILLS) {
    assert.equal(actions.some((action) => action.kind !== "unlink" && action.name === name), false);
  }
});
