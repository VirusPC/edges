import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { run } from "../../src/program.js";
import { INDEPENDENT_HARNESS_CONSTRAINT, SUPER_HARNESS_MARKER, hasSuperHarnessMarker } from "../../src/services/memory/agents.js";

function fixture(t: test.TestContext) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(tmpdir()), "super-face-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const call = (...args: string[]) => run(["--scope", root, ...args], { env: {} });
  const ok = async (...args: string[]) => {
    const result = await call(...args);
    assert.equal(result.exitCode, 0, result.stdout + result.stderr);
    return JSON.parse(result.stdout);
  };
  return { root, call, ok };
}

function count(text: string, needle: string): number {
  return text.split(needle).length - 1;
}

test("init --super writes the scope-root material face and one constraints line", async (t) => {
  const { root, ok } = fixture(t);
  await ok("--super", "init");
  for (const rel of [
    "README.md",
    "projects/README.md",
    "notes/README.md",
    "tasks/README.md",
    "memory/feedbacks/README.md",
    "memory/projects/README.md",
    "memory/references/README.md",
    "skills/managed/README.md",
    "skills/referenced/README.md",
  ]) {
    assert.equal(fs.existsSync(path.join(root, rel)), true, rel);
  }
  assert.equal(fs.existsSync(path.join(root, ".edges/notes/README.md")), false);
  assert.equal(fs.existsSync(path.join(root, ".edges/projects/README.md")), false);
  const agents = fs.readFileSync(path.join(root, "AGENTS.md"), "utf8");
  assert.equal(count(agents, INDEPENDENT_HARNESS_CONSTRAINT), 1);
  assert.equal(count(agents, SUPER_HARNESS_MARKER), 1);
  assert.ok(agents.includes(`${INDEPENDENT_HARNESS_CONSTRAINT}\n${SUPER_HARNESS_MARKER}`));
  assert.match(agents, /<!-- edges-constraints:start -->[\s\S]*<edges-harness mode="super" \/>[\s\S]*<!-- edges-constraints:end -->/);
  assert.match(agents, /本目录有项目记忆/);
  const before = agents;
  await ok("--super", "init");
  const again = fs.readFileSync(path.join(root, "AGENTS.md"), "utf8");
  assert.equal(again, before);
  assert.equal(count(again, INDEPENDENT_HARNESS_CONSTRAINT), 1);
  assert.equal(count(again, SUPER_HARNESS_MARKER), 1);
});

test("init --super keeps authored constraints and module init uses the same face", async (t) => {
  const { root, ok } = fixture(t);
  fs.writeFileSync(path.join(root, "AGENTS.md"), `# Scope

<!-- edges:start -->
<!-- edges-constraints:start -->
## 本层硬约束

- 用户自己的约束保留。
<!-- edges-constraints:end -->
<!-- edges:end -->
`);
  await ok("--super", "notes", "init");
  assert.equal(fs.existsSync(path.join(root, "notes/README.md")), true);
  assert.equal(fs.existsSync(path.join(root, ".edges/notes/README.md")), false);
  const agents = fs.readFileSync(path.join(root, "AGENTS.md"), "utf8");
  assert.match(agents, /用户自己的约束保留/);
  assert.equal(count(agents, INDEPENDENT_HARNESS_CONSTRAINT), 1);
  assert.equal(count(agents, SUPER_HARNESS_MARKER), 1);
  await ok("--super", "notes", "init");
  const twice = fs.readFileSync(path.join(root, "AGENTS.md"), "utf8");
  assert.equal(count(twice, INDEPENDENT_HARNESS_CONSTRAINT), 1);
  assert.equal(count(twice, SUPER_HARNESS_MARKER), 1);
});

test("init --super adds the marker beside an older sentence and does not duplicate a marked element", async (t) => {
  const { root, ok } = fixture(t);
  const end = "<!-- edges-constraints:end -->";
  fs.writeFileSync(path.join(root, "AGENTS.md"), `# Scope

<!-- edges:start -->
<!-- edges-constraints:start -->
## 本层硬约束

- ${INDEPENDENT_HARNESS_CONSTRAINT}
${end}
<!-- edges:end -->
`);
  await ok("--super", "init", "notes");
  const added = fs.readFileSync(path.join(root, "AGENTS.md"), "utf8");
  assert.equal(count(added, SUPER_HARNESS_MARKER), 1);
  assert.equal(count(added, INDEPENDENT_HARNESS_CONSTRAINT), 1);
  fs.writeFileSync(path.join(root, "AGENTS.md"), added.replace(
    SUPER_HARNESS_MARKER,
    '<edges-harness mode="super" note="later" />',
  ));
  await ok("--super", "notes", "init");
  const kept = fs.readFileSync(path.join(root, "AGENTS.md"), "utf8");
  assert.equal(count(kept, "<edges-harness"), 1);
  assert.equal(hasSuperHarnessMarker(kept), true);
  assert.equal(kept.includes(SUPER_HARNESS_MARKER), false);
});

test("the harness marker does not make the CLI select the super face", async (t) => {
  const { root, ok } = fixture(t);
  await ok("--super", "init", "notes");
  const note = await ok("notes", "create", "--title", "Plain face");
  assert.ok(note.path.startsWith(".edges/notes/"));
  assert.equal(note.path.startsWith("notes/"), false);
});

test("memory and compose follow --super and do not fall back to .edges", async (t) => {
  const { root, call, ok } = fixture(t);
  fs.writeFileSync(path.join(root, "AGENTS.md"), "# Scope\n");
  const harness = await ok("projects", "create", "--title", "Harness");
  const harnessPath = path.relative(".edges/projects", path.dirname(harness.path));
  const face = await ok("--super", "projects", "create", "--title", "Face");
  const facePath = path.relative("projects", path.dirname(face.path));

  await ok("--super", "--project", facePath, "memory", "init", "--memory-types", "project");
  const memory = await ok(
    "--super", "--project", facePath, "memory", "remember",
    "--type", "project", "--slug", "context", "--title", "Context",
    "--description", "Known", "--content", "Known",
  );
  assert.equal(memory.path, `projects/${facePath}/memory/projects/project_context/INDEX.md`);
  assert.equal((await ok("--super", "--project", facePath, "memory", "get", "--type", "project", "--slug", "context")).slug, "context");
  assert.notEqual((await call("--project", facePath, "memory", "get", "--type", "project", "--slug", "context")).exitCode, 0);

  await ok("--project", harnessPath, "memory", "init", "--memory-types", "project");
  const harnessMemory = await ok(
    "--project", harnessPath, "memory", "remember",
    "--type", "project", "--slug", "context", "--title", "Context",
    "--description", "Known", "--content", "Known",
  );
  assert.ok(harnessMemory.path.startsWith(`.edges/projects/${harnessPath}/memory/`));

  await ok("--super", "memory", "init", "--memory-types", "project");
  const rootMemory = await ok(
    "--super", "memory", "remember",
    "--type", "project", "--slug", "root_face", "--title", "Root",
    "--description", "Root face", "--content", "Root face",
  );
  assert.equal(rootMemory.path, "memory/projects/project_root_face/INDEX.md");
  assert.equal(fs.existsSync(path.join(root, ".edges/memory/projects/project_root_face/INDEX.md")), false);

  const added = await ok("--super", "compose", "add", "--name", "brain", "--description", "Mounted brain");
  assert.equal(path.resolve(added.directory), path.join(root, "brain"));
  assert.match(added.href, /^\.\.\/brain\/README\.md$/);
  assert.equal(fs.existsSync(path.join(root, "compose/README.md")), true);
  assert.equal(fs.existsSync(path.join(root, ".edges/compose/README.md")), false);
  const listed = await ok("--super", "compose", "list");
  assert.equal(listed.entries.length, 1);
  assert.equal((await ok("compose", "list")).entries.length, 0);
});
