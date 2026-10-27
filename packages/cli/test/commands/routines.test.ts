import test from "node:test";
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { run } from "../../src/program.js";
import { RoutineNode } from "../../src/domain/models/index.js";
import { identifyNodeType } from "../../src/domain/models/node/layout.js";
import { NodeService } from "../../src/services/node/node-service.js";
import { acquireWriteLock } from "../../src/services/node/node-lock.js";
import { createRoutine, deleteRoutine, getRoutine, initRoutines, listRoutines, updateRoutine } from "../../src/services/routines/service.js";
import { initScope } from "../../src/services/init/service.js";
import "../register-skills-install-mock.js";

function scope(t: test.TestContext): string {
  const root = mkdtempSync(path.join(realpathSync(tmpdir()), "edges-routines-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}
function put(root: string, rel: string, text: string): void {
  const file = path.join(root, rel);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, text);
}
const env = (root: string) => ({ EDGES_SCOPE: root });
const names = (items: { name: string }[]) => items.map((item) => item.name).sort();
async function cli(root: string, args: string[]) {
  const result = await run(["--scope", root, ...args], { env: {} });
  assert.equal(result.exitCode, 0, result.stdout + result.stderr);
  return JSON.parse(result.stdout);
}

test("routines init is explicit, idempotent, and shares the root init module", async (t) => {
  const root = scope(t);
  const initial = await initScope({ targetDir: root });
  assert.deepEqual(initial.modules, ["memory", "skills", "notes", "projects"]);
  assert.equal(existsSync(path.join(root, ".edges/routines")), false);
  const first = await cli(root, ["routines", "init"]);
  assert.deepEqual(first.modules, ["routines"]);
  const file = path.join(root, ".edges/routines/README.md");
  const before = readFileSync(file, "utf8");
  assert.match(before, /# Routines/);
  assert.match(before, /project-entries-local:start/);
  assert.match(readFileSync(path.join(root, ".edges/README.md"), "utf8"), /routines\/README\.md/);
  const again = await cli(root, ["--super", "init", "routines"]);
  assert.deepEqual(again.modules, ["routines"]);
  assert.equal(readFileSync(file, "utf8"), before);
  assert.equal(existsSync(path.join(root, "routines")), false);
  const fresh = scope(t);
  await cli(fresh, ["routines", "init"]);
  for (const module of ["memory", "skills", "notes", "projects", "tasks"]) {
    assert.equal(existsSync(path.join(fresh, ".edges", module)), false, module);
  }
});

test("routine CRUD preserves generic frontmatter and Markdown and indexes the definition", async (t) => {
  const root = scope(t);
  await initScope({ targetDir: root, modules: ["tasks"] });
  const created = await cli(root, ["routines", "create", "daily-review", "--description", "Review daily", "--body", "Every morning, invoke [Skill](SKILL.md).\nPlatform-specific timing is prose.", "--metadata", "owner=me"]);
  assert.equal(created.path, ".edges/routines/daily-review/INDEX.md");
  assert.match(readFileSync(path.join(root, ".edges/routines/README.md"), "utf8"), /daily-review\/INDEX\.md/);
  assert.doesNotMatch(readFileSync(path.join(root, "AGENTS.md"), "utf8"), /daily-review/);
  const got = await cli(root, ["routines", "get", "daily-review"]);
  assert.equal(got.metadata.owner, "me");
  assert.match(got.body, /Platform-specific timing is prose/);
  assert.equal((await new NodeService({ managedRoot: root }).get(path.join(root, created.path)))?.type, "routine");
  const queried = await new NodeService({ managedRoot: root }).query(path.join(root, ".edges/routines/README.md"), { types: ["routine"] }).value();
  assert.equal(queried[0] instanceof RoutineNode, true);
  await cli(root, ["routines", "update", "daily-review", "--description", "Updated", "--metadata", "owner=you"]);
  const updated = await cli(root, ["routines", "get", created.path]);
  assert.equal(updated.description, "Updated");
  assert.equal(updated.metadata.owner, "you");
  const filtered = await cli(root, ["routines", "list", "--filter", "name=daily-review", "--group-by", "name"]);
  assert.equal(filtered.groups[0].key, "daily-review");
  await cli(root, ["routines", "delete", "daily-review"]);
  assert.equal(existsSync(path.join(root, created.path)), false);
  assert.doesNotMatch(readFileSync(path.join(root, ".edges/routines/README.md"), "utf8"), /daily-review\/INDEX\.md/);
});

test("routine updates refresh only its indexed description, including metadata updates", async (t) => {
  const root = scope(t);
  await initRoutines({ targetDir: root });
  await createRoutine(env(root), { name: "daily", description: "Old summary" });
  await createRoutine(env(root), { name: "other", description: "Unrelated summary" });
  const file = path.join(root, ".edges/routines/README.md");
  const original = `${readFileSync(file, "utf8")}\nPreserved explanatory text and [external link](https://example.com/).\n`;
  writeFileSync(file, original);
  await cli(root, ["routines", "update", "daily", "--description", "New summary"]);
  assert.equal(readFileSync(file, "utf8"), original.replace("Old summary", "New summary"));
  await cli(root, ["routines", "update", "daily", "--metadata", "description=Metadata summary"]);
  assert.equal(readFileSync(file, "utf8"), original.replace("Old summary", "Metadata summary"));
  assert.equal((await getRoutine(env(root), "daily", {})).description, "Metadata summary");
  assert.equal((await getRoutine(env(root), "other", {})).description, "Unrelated summary");
});

test("super selects the flat routine index; all combines forest roots without duplicates", async (t) => {
  const root = scope(t);
  await initRoutines({ targetDir: root });
  await createRoutine(env(root), { name: "maintenance", description: "Local" });
  await createRoutine(env(root), { name: "content", description: "Super", super: true });
  assert.deepEqual(names(await listRoutines(env(root), {})), ["maintenance"]);
  assert.deepEqual(names(await listRoutines(env(root), { super: true })), ["content"]);
  assert.deepEqual(names(await listRoutines(env(root), { all: true, super: true })), ["content", "maintenance"]);
  assert.deepEqual(await listRoutines(env(root), { all: true, super: true, exclude: new Set(["routines"]) }), []);
  assert.equal((await getRoutine(env(root), "content", { super: true })).path, "routines/content/INDEX.md");
  const empty = scope(t);
  assert.deepEqual(await listRoutines(env(empty), { super: true }), []);
  await createRoutine(env(empty), { name: "first", description: "No system entry", super: true });
  assert.equal(existsSync(path.join(empty, "AGENTS.md")), false);
  assert.deepEqual(names(await listRoutines(env(empty), { super: true })), ["first"]);
});

test("sibling scopes have independent names; forest lookup rejects ambiguity and includes compose", async (t) => {
  const root = scope(t);
  await initRoutines({ targetDir: root });
  for (const rel of ["left", "right", ".edges/compose/brain"]) {
    const child = path.join(root, rel);
    mkdirSync(child, { recursive: true });
    await initRoutines({ targetDir: child, rootDir: child });
    await createRoutine(env(child), { name: "repeat", description: rel });
  }
  assert.deepEqual(await listRoutines(env(root), {}), []);
  assert.equal((await listRoutines(env(path.join(root, "left")), {})).length, 1);
  assert.equal((await listRoutines(env(root), { all: true })).length, 3);
  assert.equal((await listRoutines(env(root), { all: true, exclude: new Set(["compose"]) })).length, 2);
  await assert.rejects(() => getRoutine(env(root), "repeat", { all: true }), /ambiguous/);
  const chosen = await getRoutine(env(root), "left/.edges/routines/repeat/INDEX.md", {});
  assert.equal(chosen.description, "left");
  await assert.rejects(() => getRoutine(env(path.join(root, "left")), "../right/.edges/routines/repeat/INDEX.md", {}), /escapes managed root/);
});

test("registered external routines remain readable while writes and unregistered external reads fail", async (t) => {
  const host = scope(t);
  const external = scope(t);
  for (const root of [host, external]) {
    execFileSync("git", ["init", "--quiet", root]);
    await initRoutines({ targetDir: root });
  }
  const created = await createRoutine(env(external), { name: "external-review", description: "Shared routine" });
  const hidden = await createRoutine(env(external), { name: "hidden-review", description: "Not registered on host" });
  const file = path.join(external, created.path);
  const service = new NodeService({ managedRoot: host });
  const org = await service.get(path.join(host, ".edges/routines/README.md"));
  assert.ok(org);
  await service.update(org, { body: org.body.replace("<!-- project-entries-local:end -->", `- [Shared routine](<${file}>) — Shared routine\n<!-- project-entries-local:end -->`) });
  const listed = await listRoutines(env(host), {});
  assert.deepEqual(names(listed), ["external-review"]);
  assert.equal((await getRoutine(env(host), "external-review", {})).description, "Shared routine");
  assert.equal((await getRoutine(env(host), listed[0]!.path, {})).description, "Shared routine");
  const before = readFileSync(file, "utf8");
  for (const target of ["external-review", listed[0]!.path]) {
    await assert.rejects(() => updateRoutine(env(host), target, { body: "Changed" }, {}), /escapes managed root/);
    await assert.rejects(() => deleteRoutine(env(host), target, {}), /escapes managed root/);
  }
  await assert.rejects(() => getRoutine(env(host), path.join(external, hidden.path), {}), /escapes managed root/);
  assert.equal(readFileSync(file, "utf8"), before);
  assert.equal(existsSync(path.join(external, hidden.path)), true);
});

test("registered external routine symlinks support list and get but never writes", async (t) => {
  const host = scope(t);
  const external = scope(t);
  const links = scope(t);
  for (const root of [host, external]) {
    execFileSync("git", ["init", "--quiet", root]);
    await initRoutines({ targetDir: root });
  }
  const created = await createRoutine(env(external), { name: "shared", description: "Linked routine" });
  const hidden = await createRoutine(env(external), { name: "hidden", description: "Unregistered" });
  const linkedRoot = path.join(links, "external-link");
  symlinkSync(external, linkedRoot, "dir");
  const linkedFile = path.join(linkedRoot, created.path);
  const org = path.join(host, ".edges/routines/README.md");
  const service = new NodeService({ managedRoot: host });
  const index = await service.get(org);
  assert.ok(index);
  await service.update(index, { body: index.body.replace("<!-- project-entries-local:end -->", `- [Shared](<${linkedFile}>) — Linked routine\n<!-- project-entries-local:end -->`) });
  const listed = await listRoutines(env(host), {});
  assert.deepEqual(names(listed), ["shared"]);
  for (const target of ["shared", listed[0]!.path]) {
    assert.equal((await getRoutine(env(host), target, {})).description, "Linked routine");
    await assert.rejects(() => updateRoutine(env(host), target, { description: "Changed" }, {}), /escapes managed root|read-only/);
    await assert.rejects(() => deleteRoutine(env(host), target, {}), /escapes managed root|read-only/);
  }
  await assert.rejects(() => getRoutine(env(host), path.join(linkedRoot, hidden.path), {}), /escapes managed root/);
  assert.equal((await getRoutine(env(external), "shared", {})).description, "Linked routine");
});

test("routines reject invalid names, empty descriptions, renaming, and unrelated exact paths", async (t) => {
  const root = scope(t);
  await initRoutines({ targetDir: root });
  for (const name of ["", "Bad_Name", "../elsewhere", "a".repeat(65), "two--parts"]) {
    await assert.rejects(() => createRoutine(env(root), { name, description: "Test" }), /kebab-case/);
  }
  await assert.rejects(() => createRoutine(env(root), { name: "valid", description: " " }), /nonempty/);
  await createRoutine(env(root), { name: "valid", description: "Test" });
  await assert.rejects(() => updateRoutine(env(root), "valid", { metadata: ["name=other"] }, {}), /stable/);
  await assert.rejects(() => updateRoutine(env(root), "valid", { description: " " }, {}), /nonempty/);
  put(root, "notes/other/INDEX.md", "---\nname: other\ndescription: Not a routine\n---\n# Note\n");
  for (const target of ["notes/other/INDEX.md", ".edges/routines/README.md", ".edges/routines/valid/SKILL.md", ".edges/routines/valid", "../routines/outside/INDEX.md"]) {
    await assert.rejects(() => deleteRoutine(env(root), target, {}), /routine not found|escapes managed root/);
  }
  assert.equal(existsSync(path.join(root, "notes/other/INDEX.md")), true);
  assert.equal(identifyNodeType(path.join(root, "projects/example/.edges/routines/test/INDEX.md")), "routine");
  assert.notEqual(identifyNodeType(path.join(root, "routines/project/test/INDEX.md")), "routine");
  await assert.rejects(() => getRoutine(env(root), ".edges/routines/valid/INDEX.md", { exclude: new Set(["routines"]) }), /routine not found/);
});

test("missing registered routine files fail reads and updates without repair", async (t) => {
  const root = scope(t);
  await initRoutines({ targetDir: root });
  const made = await createRoutine(env(root), { name: "damaged", description: "Test" });
  rmSync(path.join(root, made.path));
  await assert.rejects(() => listRoutines(env(root), {}), /Missing routine entry/);
  await assert.rejects(() => getRoutine(env(root), made.path, {}), /routine not found/);
  await assert.rejects(() => updateRoutine(env(root), made.path, { body: "Repair?" }, {}), /routine not found/);
  assert.equal(existsSync(path.join(root, made.path)), false);
  rmSync(path.join(root, ".edges/routines/README.md"));
  await assert.rejects(() => listRoutines(env(root), {}), /Missing routine organization entry/);
  await assert.rejects(() => getRoutine(env(root), made.path, {}), /Missing routine organization entry/);
  assert.equal(existsSync(path.join(root, ".edges/routines/README.md")), false);
});

test("routine update validates its existing index registration before changing the definition", async (t) => {
  const root = scope(t);
  await initRoutines({ targetDir: root });
  const created = await createRoutine(env(root), { name: "unindexed", description: "Original summary" });
  const definition = path.join(root, created.path);
  const org = path.join(root, ".edges/routines/README.md");
  const index = readFileSync(org, "utf8").split("\n").filter((line) => !line.includes("unindexed/INDEX.md")).join("\n");
  writeFileSync(org, index);
  const before = readFileSync(definition, "utf8");
  await assert.rejects(() => updateRoutine(env(root), created.path, { description: "Changed" }, {}), /not indexed/);
  assert.equal(readFileSync(definition, "utf8"), before);
  assert.equal(readFileSync(org, "utf8"), index);
});

test("routine update rejects a damaged indexed sibling before writing the definition or index", async (t) => {
  const root = scope(t);
  await initRoutines({ targetDir: root });
  const first = await createRoutine(env(root), { name: "first", description: "Old" });
  const second = await createRoutine(env(root), { name: "second", description: "Valid" });
  const damaged = path.join(root, second.path);
  writeFileSync(damaged, readFileSync(damaged, "utf8").replace("description: Valid\n", ""));
  const definition = path.join(root, first.path);
  const org = path.join(root, ".edges/routines/README.md");
  const beforeDefinition = readFileSync(definition, "utf8");
  const beforeIndex = readFileSync(org, "utf8");
  await assert.rejects(() => updateRoutine(env(root), first.path, { description: "New" }, {}), /description must be nonempty/);
  assert.equal(readFileSync(definition, "utf8"), beforeDefinition);
  assert.equal(readFileSync(org, "utf8"), beforeIndex);
});

test("routine directory lifecycle includes a co-located Skill and preserves an external Skill", async (t) => {
  const root = scope(t);
  await initRoutines({ targetDir: root });
  put(root, ".edges/routines/daily/SKILL.md", "---\nname: daily\ndescription: Daily steps\n---\nSteps\n");
  put(root, ".edges/skills/managed/external/SKILL.md", "---\nname: external\ndescription: External steps\n---\nSteps\n");
  await createRoutine(env(root), { name: "daily", description: "Daily", body: "[Own skill](SKILL.md) and [external](../../skills/managed/external/SKILL.md)." });
  await deleteRoutine(env(root), "daily", {});
  assert.equal(existsSync(path.join(root, ".edges/routines/daily")), false);
  assert.equal(existsSync(path.join(root, ".edges/skills/managed/external/SKILL.md")), true);
});

test("routine writes reject all and acquire the shared write lock", async (t) => {
  const root = scope(t);
  await initRoutines({ targetDir: root });
  for (const args of [["init"], ["create", "x", "--description", "X"], ["update", "x", "--body", "X"], ["delete", "x"]]) {
    const result = await run(["--scope", root, "--all", "routines", ...args], { env: {} });
    assert.notEqual(result.exitCode, 0);
    assert.match(result.stdout, /only supported by read commands/);
  }
  const release = await acquireWriteLock(root);
  try {
    const blocked = await run(["--scope", root, "routines", "create", "locked", "--description", "X"], { env: {} });
    assert.notEqual(blocked.exitCode, 0);
    assert.match(blocked.stdout, /write lock.*busy/i);
  } finally { await release(); }
});

test("routine help exposes six definition verbs and no scheduler or runtime", async () => {
  const result = await run(["routines", "--help"], { env: {} });
  assert.equal(result.exitCode, 0);
  for (const verb of ["init", "create", "list", "get", "update", "delete"]) assert.match(result.stdout, new RegExp(`^\\s+${verb}\\b`, "m"));
  for (const verb of ["run", "server", "enable", "status", "retry", "cache"]) assert.doesNotMatch(result.stdout, new RegExp(`^\\s+${verb}\\b`, "m"));
});
