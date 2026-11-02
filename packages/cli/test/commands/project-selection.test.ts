import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { run } from "../../src/program.js";
import { acquireWriteLock } from "../../src/services/node/node-lock.js";
import { composeReadmeSeed } from "../../src/domain/models/compose/compose-readme-node.js";

function fixture(t: test.TestContext) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(tmpdir()), "project-selection-"));
  fs.writeFileSync(path.join(root, "AGENTS.md"), "# Scope\n");
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const call = (...args: string[]) => run(["--scope", root, ...args], { env: {} });
  const ok = async (...args: string[]) => {
    const result = await call(...args);
    assert.equal(result.exitCode, 0, result.stdout + result.stderr);
    return JSON.parse(result.stdout);
  };
  return { root, call, ok };
}
function selection(file: string) { return path.relative(".edges/projects", path.dirname(file)); }

test("global Project selects direct materials and nested composition without creating a system", async (t) => {
  const { root, ok, call } = fixture(t);
  const p = await ok("projects", "create", "--title", "Parent");
  const project = selection(p.path);
  const q = await ok("--project", project, "projects", "create", "--title", "Child");
  const child = selection(q.path);
  assert.match(child, /--parent\/projects\/.*--child$/);
  const own = await ok("notes", "create", "--title", "Root note");
  const direct = await ok("--project", project, "notes", "create", "--title", "Direct note");
  const nested = await ok("--project", child, "--super", "notes", "create", "--title", "Nested note");
  assert.ok(direct.path.startsWith(path.dirname(p.path) + "/notes/"));
  assert.ok(nested.path.startsWith(path.dirname(q.path) + "/notes/"));
  const paths = (result: { items: Array<{ path: string }> }) => result.items.map((item) => item.path).sort();
  assert.deepEqual(paths(await ok("--project", project, "notes", "list")), [direct.path, nested.path].sort());
  assert.deepEqual(paths(await ok("--project", project, "--super", "notes", "list")), [direct.path, nested.path].sort());
  assert.deepEqual(paths(await ok("--project", child, "notes", "list")), [nested.path]);
  assert.deepEqual(paths(await ok("notes", "list")), [own.path, direct.path, nested.path].sort());
  assert.deepEqual(paths(await ok("--project", project, "--exclude", "projects", "notes", "list")), [direct.path]);
  assert.deepEqual(paths(await ok("--project", project, "projects", "list")), [q.path]);
  assert.notEqual((await call("--project", child, "notes", "get", direct.path)).exitCode, 0);
  assert.notEqual((await call("--project", project, "projects", "get", direct.path)).exitCode, 0);
  await ok("--project", project, "notes", "update", direct.path, "--body", "Updated note");
  await ok("projects", "update", p.path, "--title", "Renamed", "--body", "New context");
  assert.deepEqual(paths(await ok("--project", project, "notes", "list")), [direct.path, nested.path].sort());
  const body = (await ok("projects", "get", p.path)).body;
  assert.match(body, /New context/);
  assert.match(body, /notes\/README\.md/);
  assert.match(body, /projects\/README\.md/);
  await ok("--project", project, "routines", "create", "weekly", "--description", "Review notes");
  assert.equal((await ok("--project", project, "routines", "get", "weekly")).description, "Review notes");
  const routine = (await ok("--project", project, "routines", "list")).items[0];
  assert.equal((await ok("--project", project, "--exclude", "projects", "routines", "get", routine.path)).description, "Review notes");
  await ok("--project", project, "routines", "delete", "weekly");
  await ok("--project", project, "notes", "delete", direct.path);
  for (const directory of [path.dirname(p.path), path.dirname(q.path)]) {
    assert.equal(fs.existsSync(path.join(root, directory, "AGENTS.md")), false);
    assert.equal(fs.existsSync(path.join(root, directory, ".edges")), false);
  }
});

test("Project all includes its unregistered independent systems but not siblings", async (t) => {
  const { root, ok } = fixture(t);
  const p = await ok("projects", "create", "--title", "Parent");
  const project = selection(p.path);
  const direct = await ok("--project", project, "notes", "create", "--title", "Direct");
  for (const [dir, title] of [[path.join(path.dirname(p.path), "independent"), "Inside"], ["sibling", "Outside"]]) {
    const target = path.join(root, dir!);
    fs.mkdirSync(target, { recursive: true });
    const result = await run(["--scope", target, "notes", "init"], { env: {} });
    assert.equal(result.exitCode, 0, result.stdout);
    const made = await run(["--scope", target, "notes", "create", "--title", title!], { env: {} });
    assert.equal(made.exitCode, 0, made.stdout);
  }
  assert.deepEqual((await ok("--project", project, "notes", "list")).items.map((item: { path: string }) => item.path), [direct.path]);
  for (const flags of [["--all"], ["--all", "--super"]]) {
    assert.deepEqual((await ok("--project", project, ...flags, "notes", "list")).items.map((item: { title: string }) => item.title).sort(), ["Direct", "Inside"]);
  }
});

test("Project selector rejects traversal, nonprojects, aliases and conflicting targets before mutation", async (t) => {
  const { root, ok, call } = fixture(t);
  const p = await ok("projects", "create", "--title", "Parent");
  const project = selection(p.path);
  fs.symlinkSync(path.join(root, path.dirname(p.path)), path.join(root, ".edges/projects/alias"));
  for (const value of ["", "..", "/tmp", project + "/../missing", project + "/notes", "alias", "missing", project + "/projects/missing"]) {
    const result = await call("--project", value, "notes", "create", "--title", "Rejected");
    assert.notEqual(result.exitCode, 0, result.stdout);
  }
  for (const flag of ["--target-dir", "--repo-dir"]) {
    const args = flag === "--target-dir" ? ["notes", "init"] : ["memory", "restore", "--archive", "missing"];
    const result = await call("--project", project, ...args, flag, root);
    assert.match(result.stdout, /cannot be combined/);
  }
  const release = await acquireWriteLock(root);
  try {
    assert.match((await call("--project", "missing", "notes", "create", "--title", "Blocked")).stdout, /write lock.*busy/i);
  } finally { await release(); }
  assert.equal(fs.existsSync(path.join(root, path.dirname(p.path), "notes")), false);
});

test("Project deletion requires recursive for resources and nested materials", async (t) => {
  const { root, ok, call } = fixture(t);
  const empty = await ok("projects", "create", "--title", "Empty");
  await ok("projects", "delete", empty.path);
  const scaffold = await ok("projects", "create", "--title", "Scaffold");
  for (const module of ["notes", "tasks", "projects", "routines", "memory"]) {
    await ok("--project", selection(scaffold.path), module, "init", ...(module === "memory" ? ["--memory-types", "project"] : []));
  }
  const compose = path.join(root, path.dirname(scaffold.path), "compose");
  fs.mkdirSync(compose);
  fs.writeFileSync(path.join(compose, "README.md"), composeReadmeSeed());
  assert.equal((await ok("projects", "delete", scaffold.path)).directory, path.dirname(scaffold.path));
  const authored = await ok("projects", "create", "--title", "Authored index");
  await ok("--project", selection(authored.path), "notes", "init");
  fs.appendFileSync(path.join(root, path.dirname(authored.path), "notes/README.md"), "\nUser explanation to preserve.\n");
  assert.match((await call("projects", "delete", authored.path)).stdout, /--recursive/);
  for (const resource of [true, false]) {
    const p = await ok("projects", "create", "--title", resource ? "Resources" : "Materials");
    if (resource) fs.writeFileSync(path.join(root, path.dirname(p.path), "unregistered.bin"), Buffer.from([0, 255, 17]));
    else await ok("--project", selection(p.path), "notes", "create", "--title", "Child");
    assert.match((await call("projects", "delete", p.path)).stdout, /--recursive/);
    assert.equal(fs.existsSync(path.join(root, p.path)), true);
    await ok("projects", "delete", p.path, "--recursive");
    assert.equal(fs.existsSync(path.join(root, path.dirname(p.path))), false);
  }
});

test("Compose uses the selected Project index and leaves the default material separate", async (t) => {
  const { root, ok } = fixture(t);
  const p = await ok("projects", "create", "--title", "Parent");
  const project = selection(p.path);
  await ok("--project", project, "compose", "add", "--name", "vendor", "--description", "Shared skills");
  assert.match(fs.readFileSync(path.join(root, p.path), "utf8"), /compose\/README\.md/);
  const checkout = path.join(root, path.dirname(p.path), "compose/vendor");
  fs.mkdirSync(checkout, { recursive: true });
  for (const args of [["notes", "init"], ["notes", "create", "--title", "Vendor note"]]) {
    const result = await run(["--scope", checkout, ...args], { env: {} });
    assert.equal(result.exitCode, 0, result.stdout);
  }
  assert.equal((await ok("--project", project, "--all", "notes", "list")).items.length, 1);
  assert.equal((await ok("--project", project, "--all", "--exclude", "compose", "notes", "list")).items.length, 0);
  assert.equal((await ok("--project", project, "compose", "list")).entries.length, 1);
  assert.equal((await ok("compose", "list")).entries.length, 0);
  assert.equal(fs.existsSync(path.join(root, path.dirname(p.path), "AGENTS.md")), false);
});


test("Project selection keeps reading legacy lowercase entry filenames", async (t) => {
  const { root, ok } = fixture(t);
  const p = await ok("projects", "create", "--title", "Legacy");
  const directory = path.dirname(path.join(root, p.path));
  fs.renameSync(path.join(directory, "INDEX.md"), path.join(directory, "index.md"));
  const project = selection(p.path);
  await ok("--project", project, "notes", "create", "--title", "Still reachable");
  await ok("--project", project, "memory", "init", "--memory-types", "project");
  await ok("--project", project, "memory", "remember", "--type", "project", "--slug", "context", "--title", "Context", "--description", "Known context", "--content", "Known context");
  assert.equal((await ok("--project", project, "notes", "list")).items.length, 1);
  assert.match(fs.readFileSync(path.join(directory, "index.md"), "utf8"), /notes\/README/);
});

test("Compose exclusions cover custom checkouts of nested Projects", async (t) => {
  const { root, ok } = fixture(t);
  const p = await ok("projects", "create", "--title", "Parent");
  const q = await ok("--project", selection(p.path), "projects", "create", "--title", "Child");
  const checkout = path.join(path.dirname(q.path), "vendor");
  await ok("--project", selection(q.path), "compose", "add", "--name", "vendor", "--path", checkout, "--description", "Nested shared notes");
  fs.mkdirSync(path.join(root, checkout), { recursive: true });
  for (const args of [["notes", "init"], ["notes", "create", "--title", "Nested vendor note"]]) {
    const result = await run(["--scope", path.join(root, checkout), ...args], { env: {} });
    assert.equal(result.exitCode, 0, result.stdout);
  }
  for (const project of [selection(p.path), selection(q.path)]) {
    assert.equal((await ok("--project", project, "--all", "notes", "list")).items.length, 1);
    assert.equal((await ok("--project", project, "--all", "--exclude", "compose", "notes", "list")).items.length, 0);
  }
});
