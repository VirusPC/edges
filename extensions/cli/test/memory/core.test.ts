import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  initMemory,
  rememberMemory,
  addMemoryType,
  doctorMemory,
  layerTypeSpecs,
  parseFrontmatter,
} from "../../src/services/memory/index.js";
function fixture(t: any) {
  const dir = mkdtempSync(join(tmpdir(), "memory-core-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}
const read = (dir: string, file: string) =>
  readFileSync(join(dir, file), "utf8");
const put = (dir: string, file: string, body: string | Buffer) => {
  const path = join(dir, file);
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, body);
};
const projectIndex = ".harness/memory/projects/AGENTS.md";
test("init requires selection without mutation and reruns preserve selected adoption", (t) => {
  const targetDir = fixture(t);
  assert.equal(initMemory({ targetDir }).selectionRequired, true);
  assert.deepEqual(readdirSync(targetDir), []);
  initMemory({ targetDir, memoryTypes: ["project"] });
  assert.deepEqual(
    layerTypeSpecs(targetDir).map((s) => s.name),
    ["project"],
  );
  const before = read(targetDir, "AGENTS.md");
  initMemory({ targetDir });
  assert.equal(read(targetDir, "AGENTS.md"), before);
  assert.equal(existsSync(join(targetDir, ".harness/memory/users")), false);
});
test("remember refreshes index and preserves YAML metadata and origin on update", (t) => {
  const targetDir = fixture(t);
  initMemory({ targetDir, memoryTypes: ["project"] });
  rememberMemory({
    targetDir,
    type: "project",
    slug: "decision",
    title: "Decision",
    description: "When deciding",
    content: "Original",
    originSessionId: "first",
  });
  const path = ".harness/memory/projects/project_decision.md";
  put(
    targetDir,
    path,
    read(targetDir, path).replace(
      "metadata:",
      "license: MIT\nmetadata:\n  vendor: {nested: [one, two]}",
    ),
  );
  rememberMemory({
    targetDir,
    type: "project",
    slug: "decision",
    content: "Changed",
  });
  assert.match(read(targetDir, path), /vendor:/);
  assert.match(read(targetDir, path), /edges-origin-session-id: first/);
  assert.match(read(targetDir, path), /license: MIT/);
  assert.match(
    read(targetDir, projectIndex),
    /\[Decision\]\(project_decision.md\) — When deciding/,
  );
  assert.equal(doctorMemory({ targetDir }).remaining.length, 0);
});
test("managed uses skill format and referenced remains read only with missing source diagnostics", (t) => {
  const targetDir = fixture(t);
  const result = initMemory({
    targetDir,
    skillTypes: ["managed", "referenced"],
  });
  assert.equal(result.complete, false);
  assert.equal(result.diagnostics?.[0]?.code, "source-scan-error");
  rememberMemory({
    targetDir,
    type: "managed",
    slug: "my-method",
    description: "Run it",
    content: "Steps",
  });
  assert.equal(
    parseFrontmatter(
      join(targetDir, ".harness/skills/managed/my-method/SKILL.md"),
    ).name,
    "my-method",
  );
  assert.throws(
    () =>
      rememberMemory({
        targetDir,
        type: "referenced",
        slug: "no",
        content: "no",
      }),
    /只索引/,
  );
  assert.equal(existsSync(join(targetDir, ".agents")), false);
});
test("private custom privileges are preserved, ignored before writing, and cannot be inferred when lost", (t) => {
  const targetDir = fixture(t);
  mkdirSync(join(targetDir, ".git"));
  initMemory({ targetDir, memoryTypes: ["project"] });
  addMemoryType({
    targetDir,
    name: "recipes",
    description: "Private methods",
    gitignore: true,
    skillsFormat: true,
  });
  assert.match(
    read(targetDir, ".gitignore"),
    /\*\*\/\.harness\/memory\/recipes\//,
  );
  addMemoryType({ targetDir, name: "recipes", description: "Retry" });
  rememberMemory({
    targetDir,
    type: "recipes",
    slug: "my-recipe",
    description: "recipe",
    content: "Steps",
  });
  assert.equal(
    layerTypeSpecs(targetDir).find((s) => s.name === "recipes")?.gitignore,
    true,
  );
  const index = ".harness/memory/recipes/AGENTS.md";
  put(targetDir, index, read(targetDir, index).replace("writable: true\n", ""));
  assert.throws(() => initMemory({ targetDir }), /privilege/);
  assert.ok(
    doctorMemory({ targetDir, apply: true }).remaining.some(
      (f) => f.code === "unsafe-layout",
    ),
  );
});
test("doctor diagnoses without writes and apply repairs foreign agents and stale indexes idempotently", (t) => {
  const targetDir = fixture(t);
  initMemory({ targetDir, memoryTypes: ["project"] });
  put(targetDir, "AGENTS.md", "# Manual\nKeep this.\n");
  put(
    targetDir,
    ".harness/memory/projects/project_a.md",
    "---\nname: a\ndescription: test\n---\nBody\n",
  );
  const before = read(targetDir, projectIndex);
  const report = doctorMemory({ targetDir });
  assert.ok(report.findings.length);
  assert.equal(read(targetDir, projectIndex), before);
  assert.equal(doctorMemory({ targetDir, apply: true }).remaining.length, 0);
  assert.match(read(targetDir, "AGENTS.md"), /^# Manual\nKeep this/);
  assert.deepEqual(doctorMemory({ targetDir, apply: true }).repaired, []);
});
test("source read errors preserve existing indexes and invalid frontmatter remains diagnosed", (t) => {
  const targetDir = fixture(t);
  initMemory({ targetDir, memoryTypes: ["project"] });
  const before = read(targetDir, projectIndex);
  put(
    targetDir,
    ".harness/memory/projects/project_bad.md",
    Buffer.from([0xff]),
  );
  assert.equal(initMemory({ targetDir }).complete, false);
  assert.equal(read(targetDir, projectIndex), before);
  assert.ok(
    doctorMemory({ targetDir, apply: true }).remaining.some(
      (f) => f.code === "source-scan-error",
    ),
  );
  put(
    targetDir,
    ".harness/memory/projects/project_bad.md",
    "---\ndescription: unclosed\n",
  );
  assert.ok(
    doctorMemory({ targetDir, apply: true }).remaining.some(
      (f) => f.code === "invalid-entry",
    ),
  );
});
test("managed symlink escapes are rejected and referenced links deduplicate by realpath", (t) => {
  const targetDir = fixture(t);
  const external = fixture(t);
  initMemory({
    targetDir,
    memoryTypes: ["project"],
    skillTypes: ["referenced"],
  });
  symlinkSync(external, join(targetDir, ".harness/memory/projects/escape"));
  assert.throws(() =>
    rememberMemory({
      targetDir,
      type: "project",
      slug: "escape/no",
      title: "x",
      description: "x",
      content: "x",
    }),
  );
  put(
    external,
    "SKILL.md",
    "---\nname: ext\ndescription: external\n---\nSteps",
  );
  mkdirSync(join(targetDir, ".agents/skills"), { recursive: true });
  symlinkSync(external, join(targetDir, ".agents/skills/a"));
  symlinkSync(external, join(targetDir, ".agents/skills/b"));
  assert.equal(initMemory({ targetDir }).complete, true);
  assert.equal(
    read(targetDir, ".harness/skills/referenced/AGENTS.md").split(" — external")
      .length - 1,
    1,
  );
});
test("sparse scopes rehome descendants and nested git roots are excluded", (t) => {
  const targetDir = fixture(t);
  mkdirSync(join(targetDir, ".git"));
  const child = join(targetDir, "a/b");
  mkdirSync(child, { recursive: true });
  initMemory({
    targetDir: child,
    rootDir: targetDir,
    memoryTypes: ["project"],
    description: "Child",
  });
  assert.match(read(targetDir, "AGENTS.md"), /a\/b\/AGENTS.md/);
  initMemory({
    targetDir: join(targetDir, "a"),
    rootDir: targetDir,
    memoryTypes: ["feedback"],
  });
  assert.doesNotMatch(read(targetDir, "AGENTS.md"), /a\/b\/AGENTS.md/);
  assert.match(read(targetDir, "a/AGENTS.md"), /b\/AGENTS.md/);
  const nested = join(targetDir, "nested");
  mkdirSync(join(nested, ".git"), { recursive: true });
  initMemory({ targetDir: nested, memoryTypes: ["project"] });
  assert.throws(
    () =>
      initMemory({
        targetDir: nested,
        rootDir: targetDir,
        memoryTypes: ["project"],
      }),
    /Git root/,
  );
  assert.equal(
    doctorMemory({ targetDir, apply: true }).memoryDirs.includes("nested"),
    false,
  );
});
