import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, realpathSync, rmSync, mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { tmpdir } from "node:os";
import { initScope, initMemory } from "../../src/services/init/service.js";
import { rememberMemory } from "../../src/services/memory/remember.js";
import { getMemoryEntry, listMemoryEntries, deleteMemoryEntry } from "../../src/services/memory/records.js";
import { addMemoryType } from "../../src/services/memory/add-type.js";
import { doctorMemory } from "../../src/services/memory/doctor.js";
import { backupUserMemory, restoreUserMemory } from "../../src/services/memory/archive.js";
import { layerTypeSpecs, typeIndexPath } from "../../src/services/memory/types.js";
import { createManagedSkill, listSkills, getSkill, updateSkill, deleteSkill } from "../../src/services/skills/service.js";
import { NodeService } from "../../src/services/node/node-service.js";
import { ProjectNode } from "../../src/domain/models/projects/project-node.js";

async function fixture(t: test.TestContext) {
  const scope = realpathSync(mkdtempSync(join(tmpdir(), "project-memory-")));
  t.after(() => rmSync(scope, { recursive: true, force: true }));
  await initScope({ targetDir: scope, modules: ["memory", "projects"] });
  const project = join(scope, ".edges/projects/2026-11-02--theme");
  await new NodeService({ managedRoot: scope }).create(new ProjectNode(join(project, "INDEX.md")), {
    title: "Theme", body: "# Theme\n\nAuthored context stays.\n",
  });
  return { scope, project, env: { EDGES_SCOPE: scope } };
}
const remember = (scope: string, project?: string, type = "project", slug = "same") =>
  rememberMemory({ targetDir: scope, project, type, slug, title: "Same", description: "Selected context", content: project ? "Theme context" : "Root context" });

test("Project memory adoption and CRUD stay separate from root and child Projects", async (t) => {
  const { scope, project } = await fixture(t);
  const rootBefore = readFileSync(join(scope, "AGENTS.md"), "utf8");
  await assert.rejects(() => remember(scope, project), /未在该层登记/);
  await initMemory({ targetDir: scope, project, memoryTypes: ["project"] });
  await remember(scope);
  await remember(scope, project);
  const entry = await getMemoryEntry(scope, "project", "same", { project });
  assert.equal(join(scope, entry.path), join(project, "memory/projects/project_same/INDEX.md"));
  assert.equal(typeIndexPath(scope, "project", { project }), join(project, "memory/projects/README.md"));
  assert.equal(readFileSync(join(scope, "AGENTS.md"), "utf8"), rootBefore);
  assert.equal(existsSync(join(project, "AGENTS.md")), false);
  assert.equal(existsSync(join(project, ".edges")), false);
  await initScope({ targetDir: scope, project, modules: ["projects"] });
  const child = join(project, "projects/2026-11-02--child");
  await new NodeService({ managedRoot: scope }).create(new ProjectNode(join(child, "INDEX.md")), { body: "# Child\n" });
  await initMemory({ targetDir: scope, project: child, memoryTypes: ["project"] });
  await remember(scope, child);
  const listed = await listMemoryEntries(scope, "project", { project, all: true, super: true });
  assert.equal(listed.items.length, 2);
  assert.deepEqual(listed.items.map(item => item.slug), ["same", "same"]);
  assert.ok(listed.items.every(item => item.path.startsWith(relative(scope, project) + "/")));
  await deleteMemoryEntry(scope, "project", "same", { project });
  assert.ok(await getMemoryEntry(scope, "project", "same"));
  assert.ok(await getMemoryEntry(scope, "project", "same", { project: child }));
  assert.deepEqual((await doctorMemory({ targetDir: scope, project, apply: true })).remaining, []);
});

test("custom type identity and doctor repair are bounded to the selected Project", async (t) => {
  const { scope, project } = await fixture(t);
  await addMemoryType({ targetDir: scope, name: "decisions", description: "Root decisions", indexOnly: true });
  await addMemoryType({ targetDir: scope, project, name: "decisions", description: "Theme decisions" });
  await remember(scope, project, "decisions");
  assert.equal(layerTypeSpecs(scope).find(spec => spec.name === "decisions")?.writable, false);
  assert.equal(layerTypeSpecs(scope, { project }).find(spec => spec.name === "decisions")?.writable, true);
  const projectIndex = join(project, "INDEX.md"), before = readFileSync(projectIndex, "utf8");
  writeFileSync(projectIndex, before.replace(/^- .*memory\/decisions.*\n/gm, ""));
  const rootIndex = typeIndexPath(scope, "project");
  const rootStale = readFileSync(rootIndex, "utf8") + "\nRoot untouched\n";
  writeFileSync(rootIndex, rootStale);
  const report = await doctorMemory({ targetDir: scope, project, apply: true });
  assert.ok(report.findings.some(item => item.code === "unregistered-type"));
  assert.deepEqual(report.remaining, []);
  assert.match(readFileSync(projectIndex, "utf8"), /Authored context stays/);
  assert.match(readFileSync(projectIndex, "utf8"), /memory\/decisions\/README.md/);
  assert.equal(readFileSync(rootIndex, "utf8"), rootStale);
});

test("Project skills use direct managed content and the original scope installation", async (t) => {
  const { scope, project, env } = await fixture(t);
  const installed = join(scope, ".agents/skills/installed/SKILL.md");
  mkdirSync(join(installed, ".."), { recursive: true });
  writeFileSync(installed, "---\nname: installed\ndescription: Installed skill\n---\nInstalled body\n");
  await initScope({ targetDir: scope, project, modules: ["skills"] });
  assert.match(readFileSync(join(project, "skills/referenced/README.md"), "utf8"), /\.agents\/skills\/installed\/SKILL.md/);
  assert.equal(existsSync(join(project, ".agents")), false);
  await createManagedSkill(env, { project, super: true, name: "theme-skill", description: "Theme skill", body: "Body" });
  assert.ok(existsSync(join(project, "skills/managed/theme-skill/SKILL.md")));
  assert.equal((await listSkills(env, { project })).length, 2);
  assert.match((await getSkill(env, relative(scope, installed), { project })).body, /Installed body/);
  await assert.rejects(() => updateSkill(env, "installed", { body: "Cannot change" }, { project }), /read.only/i);
  assert.match((await getSkill(env, "theme-skill", { project })).body, /Body/);
  await updateSkill(env, "theme-skill", { body: "Changed" }, { project });
  assert.match((await getSkill(env, "theme-skill", { project })).body, /Changed/);
  await deleteSkill(env, "theme-skill", { project });
  assert.ok(existsSync(installed));
  assert.equal((await listSkills(env, { project })).length, 1);
});

test("private Project memory is ignored and portable restore stays inside the selection", async (t) => {
  const { scope, project } = await fixture(t);
  execFileSync("git", ["init", "-q"], { cwd: scope });
  await initMemory({ targetDir: scope, memoryTypes: ["user"] });
  await initMemory({ targetDir: scope, project, memoryTypes: ["user"] });
  const rootEntry = await remember(scope, undefined, "user");
  const entry = await remember(scope, project, "user");
  execFileSync("git", ["check-ignore", "--quiet", entry.path], { cwd: scope });
  const original = readFileSync(join(scope, entry.path), "utf8");
  const rootOriginal = readFileSync(join(scope, rootEntry.path), "utf8");
  const { archive } = await backupUserMemory({ repoDir: scope, project, timestamp: "selection" });
  rmSync(join(project, "memory/users"), { recursive: true });
  await restoreUserMemory({ repoDir: scope, project, archive });
  assert.equal(readFileSync(join(scope, entry.path), "utf8"), original);
  assert.equal(readFileSync(join(scope, rootEntry.path), "utf8"), rootOriginal);
  assert.equal(existsSync(join(project, ".edges")), false);
});
