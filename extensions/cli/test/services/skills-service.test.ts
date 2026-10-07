import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { managedSkillFile, resolveSkill } from "../../src/services/skills/service.js";

test("managed skill files use kebab-case names under skills/managed", () => {
  const scope = path.resolve("/tmp/edges-skill-scope");
  assert.equal(
    managedSkillFile(scope, "demo-skill", false),
    path.join(scope, ".harness/skills/managed/demo-skill/SKILL.md"),
  );
  assert.equal(
    managedSkillFile(scope, "demo-skill", true),
    path.join(scope, "skills/managed/demo-skill/SKILL.md"),
  );
  assert.throws(
    () => managedSkillFile(scope, "Bad_Name", false),
    /Bad_Name: name must be lowercase kebab-case, 1–64 characters\./,
  );
  assert.throws(
    () => managedSkillFile(scope, "a".repeat(65), false),
    /name must be lowercase kebab-case, 1–64 characters\./,
  );
});

test("resolveSkill rejects paths outside the managed root and unknown names", async (t) => {
  const root = mkdtempSync(path.join(tmpdir(), "edges-skill-resolve-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const agents = path.join(root, "AGENTS.md");
  mkdirSync(root, { recursive: true });
  writeFileSync(agents, "# Scope\n");
  await assert.rejects(
    () => resolveSkill({ EDGES_SCOPE: root }, "../SKILL.md", {}),
    /skill not found: \.\.\/SKILL\.md/,
  );
  await assert.rejects(
    () => resolveSkill({ EDGES_SCOPE: root }, "missing-skill", {}),
    /skill not found: missing-skill/,
  );
});
