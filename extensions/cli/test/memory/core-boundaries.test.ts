import test, { type TestContext } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { execFileSync } from "node:child_process";
import {
  initMemory,
  rememberMemory,
  addMemoryType,
  doctorMemory,
  layerTypeSpecs,
  indexFiles,
  parseFrontmatter,
  parseTypeMeta,
  validateTypeName,
} from "../../src/services/memory/index.js";
function fixture(t: TestContext) {
  const dir = fs.mkdtempSync(join(tmpdir(), "memory-boundary-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}
const read = (d: string, p: string) => fs.readFileSync(join(d, p), "utf8");
const put = (d: string, p: string, text: string) => {
  fs.mkdirSync(dirname(join(d, p)), { recursive: true });
  fs.writeFileSync(join(d, p), text);
};
const skill = "---\nname: same\ndescription: example\n---\nBody\n";
const base = (t: TestContext) => {
  const d = fixture(t);
  initMemory({ targetDir: d, memoryTypes: ["project"] });
  return d;
};
const remember = (d: string, type: string, slug = "example") =>
  rememberMemory({
    targetDir: d,
    type,
    slug,
    title: "Example",
    description: "example",
    content: "Body",
    username: "fixture",
    email: "fixture@example.test",
  });
const pi = ".harness/memory/projects/AGENTS.md";
test("recommendation names and custom name validation preserve type identity rules", () => {
  assert.deepEqual(Object.keys(indexFiles()), [
    "user",
    "feedback",
    "project",
    "reference",
    "managed",
    "referenced",
  ]);
  for (const name of ["User", "managed", "my-type", "My_type", "../escape"])
    assert.throws(() => validateTypeName(name));
  assert.equal(validateTypeName("my_type"), "my_type");
});
test("empty selection, unknown types and uninitialized writes do not mutate", (t) => {
  const d = fixture(t);
  assert.throws(() => initMemory({ targetDir: d, memoryTypes: [] }));
  assert.throws(() => initMemory({ targetDir: d, memoryTypes: ["docs"] }));
  assert.throws(() =>
    addMemoryType({ targetDir: d, name: "docs", description: "Docs" }),
  );
  assert.throws(() => remember(d, "project"));
  assert.deepEqual(fs.readdirSync(d), []);
});
for (const module of ["memory", "skills"] as const)
  test(`custom skills format preserves selected ${module} module`, (t) => {
    const d = base(t);
    addMemoryType({
      targetDir: d,
      module,
      name: "recipes",
      description: "Recipes",
      skillsFormat: true,
    });
    remember(d, "recipes", "run-it");
    initMemory({ targetDir: d });
    assert.ok(
      fs.existsSync(join(d, `.harness/${module}/recipes/run-it/SKILL.md`)),
    );
    assert.throws(() =>
      addMemoryType({
        targetDir: d,
        module: module === "memory" ? "skills" : "memory",
        name: "recipes",
        description: "Conflict",
      }),
    );
  });
test("custom type plural path collision cannot overwrite original type", (t) => {
  const d = base(t);
  addMemoryType({ targetDir: d, name: "docs", description: "Docs" });
  const before = read(d, ".harness/memory/docs/AGENTS.md");
  assert.throws(
    () =>
      addMemoryType({ targetDir: d, name: "doc", description: "Collision" }),
    /already belongs/,
  );
  assert.equal(read(d, ".harness/memory/docs/AGENTS.md"), before);
});
test("custom readonly, external source stub and no-git flags are explicit", (t) => {
  const d = base(t);
  const added = addMemoryType({
    targetDir: d,
    name: "secrets",
    description: "Private",
    indexOnly: true,
    gitignore: true,
  });
  assert.equal(added.gitignoreAction, "skipped-no-git");
  assert.throws(() => remember(d, "secrets"), /只索引/);
  assert.throws(
    () =>
      addMemoryType({
        targetDir: d,
        name: "remote",
        description: "Remote",
        externalContentDir: "outside",
      }),
    /stubbed/,
  );
  assert.equal(
    addMemoryType({ targetDir: d, name: "secrets", description: "Again" }).flags
      .writable,
    false,
  );
});
test("old skills name is not a runtime alias but can be a custom ordinary type", (t) => {
  const d = base(t);
  assert.throws(() => remember(d, "skills"));
  addMemoryType({ targetDir: d, name: "skills", description: "Ordinary" });
  remember(d, "skills");
  assert.ok(fs.existsSync(join(d, ".harness/memory/skills/skills_example.md")));
});
for (const change of [
  "writable: false\n",
  "gitignore: true\n",
  "all",
  "invalid",
])
  test(`custom permissions ${change.trim()} cannot silently default`, (t) => {
    const d = base(t);
    addMemoryType({
      targetDir: d,
      name: "secrets",
      description: "Private",
      indexOnly: true,
      gitignore: true,
    });
    const index = ".harness/memory/secrets/AGENTS.md";
    let text = read(d, index);
    text =
      change === "all"
        ? text.replace(
            /<!-- project-memory-type:start -->[\s\S]*?<!-- project-memory-type:end -->/,
            "",
          )
        : change === "invalid"
          ? text.replace("writable: false", "writable: maybe")
          : text.replace(change, "");
    put(d, index, text);
    assert.throws(() =>
      initMemory({ targetDir: d, memoryTypes: ["feedback"] }),
    );
    assert.throws(() => remember(d, "secrets"));
    assert.ok(
      doctorMemory({ targetDir: d, apply: true }).remaining.some(
        (f) => f.code === "unsafe-layout",
      ),
    );
    assert.equal(read(d, index), text);
    assert.equal(fs.existsSync(join(d, ".harness/memory/feedbacks")), false);
  });
for (const [name, field, from, to] of [
  ["user", "gitignore", "true", "false"],
  ["managed", "writable", "true", "false"],
  ["managed", "format", "skills", "ordinary"],
  ["referenced", "writable", "false", "true"],
] as const)
  test(`official ${name} rejects ${field}=${to}`, (t) => {
    const d = fixture(t);
    initMemory({
      targetDir: d,
      memoryTypes: name === "user" ? ["user"] : [],
      skillTypes: name === "user" ? [] : [name],
    });
    const spec = layerTypeSpecs(d)[0]!;
    const before =
      read(d, spec.indexFile) +
      `\n<!-- project-memory-type:start -->\nname: ${name}\nmodule: ${spec.module}\nwritable: ${field === "writable" ? to : spec.writable}\ngitignore: ${field === "gitignore" ? to : spec.gitignore}\nformat: ${field === "format" ? to : spec.format}\n<!-- project-memory-type:end -->\n`;
    put(d, spec.indexFile, before);
    assert.throws(() => initMemory({ targetDir: d }));
    assert.ok(
      doctorMemory({ targetDir: d, apply: true }).remaining.some(
        (f) => f.code === "unsafe-layout",
      ),
    );
    assert.equal(read(d, spec.indexFile), before);
  });
test("linked harness and linked managed write ancestor never escape", (t) => {
  const d = fixture(t),
    external = fixture(t);
  fs.symlinkSync(external, join(d, ".harness"));
  assert.throws(() => initMemory({ targetDir: d, memoryTypes: ["project"] }));
  assert.deepEqual(fs.readdirSync(external), []);
  fs.unlinkSync(join(d, ".harness"));
  initMemory({ targetDir: d, skillTypes: ["managed"] });
  fs.symlinkSync(external, join(d, ".harness/skills/managed/escape"));
  assert.throws(() => remember(d, "managed", "escape"));
  assert.deepEqual(fs.readdirSync(external), []);
});
test("linked index and gitignore reject writes before private content", (t) => {
  const d = fixture(t),
    outside = fixture(t);
  fs.mkdirSync(join(d, ".git"));
  initMemory({ targetDir: d, memoryTypes: ["user"] });
  fs.unlinkSync(join(d, ".gitignore"));
  put(outside, "ignore", "Keep");
  fs.symlinkSync(join(outside, "ignore"), join(d, ".gitignore"));
  assert.throws(() => remember(d, "user"));
  assert.equal(
    fs.existsSync(join(d, ".harness/memory/users/user_example.md")),
    false,
  );
  assert.equal(read(outside, "ignore"), "Keep");
});
test("private ignore is reestablished before remember and applies to nested user entries", (t) => {
  const d = fixture(t);
  execFileSync("git", ["init", "-q", d]);
  const nested = join(d, "nested");
  fs.mkdirSync(nested);
  initMemory({ targetDir: nested, rootDir: d, memoryTypes: ["user"] });
  fs.unlinkSync(join(d, ".gitignore"));
  remember(nested, "user");
  for (const file of [
    "nested/.harness/memory/users/AGENTS.md",
    "nested/.harness/memory/users/user_example.md",
  ])
    assert.ok(
      execFileSync("git", ["-C", d, "check-ignore", file], {
        encoding: "utf8",
      }).includes(file),
    );
});
test("source aliases deduplicate per type but same names and cross-type ownership survive", (t) => {
  const d = fixture(t);
  initMemory({ targetDir: d, skillTypes: ["managed", "referenced"] });
  put(d, ".harness/skills/managed/original/SKILL.md", skill);
  fs.symlinkSync("original", join(d, ".harness/skills/managed/alias"));
  fs.mkdirSync(join(d, ".agents/skills"), { recursive: true });
  fs.symlinkSync(
    join(d, ".harness/skills/managed/original"),
    join(d, ".agents/skills/linked"),
  );
  put(d, ".agents/skills/other/SKILL.md", skill);
  put(d, "child/.agents/skills/hidden/SKILL.md", skill);
  assert.equal(initMemory({ targetDir: d }).complete, true);
  assert.equal(
    read(d, ".harness/skills/managed/AGENTS.md").split(" — example").length - 1,
    1,
  );
  assert.equal(
    read(d, ".harness/skills/referenced/AGENTS.md").split(" — example").length -
      1,
    2,
  );
});
test("broken and unreadable referenced sources preserve exact index bytes", (t) => {
  const d = fixture(t);
  put(d, ".agents/skills/one/SKILL.md", skill);
  initMemory({ targetDir: d, skillTypes: ["referenced"] });
  const index = ".harness/skills/referenced/AGENTS.md",
    before = read(d, index);
  fs.symlinkSync("missing", join(d, ".agents/skills/broken"));
  assert.equal(initMemory({ targetDir: d }).complete, false);
  doctorMemory({ targetDir: d, apply: true });
  assert.equal(read(d, index), before);
  fs.unlinkSync(join(d, ".agents/skills/broken"));
  if (process.getuid?.() !== 0) {
    fs.chmodSync(join(d, ".agents/skills/one/SKILL.md"), 0);
    t.after(() => {});
    try {
      assert.equal(initMemory({ targetDir: d }).complete, false);
      assert.equal(read(d, index), before);
    } finally {
      fs.chmodSync(join(d, ".agents/skills/one/SKILL.md"), 0o600);
    }
  }
});
test("legacy owner or legacy explicit root rejects all daily mutation", (t) => {
  const d = fixture(t);
  put(d, ".memory/projects/project_old.md", "old");
  const child = join(d, "child");
  fs.mkdirSync(child);
  assert.throws(
    () =>
      initMemory({ targetDir: child, rootDir: d, memoryTypes: ["project"] }),
    /migration-required/,
  );
  assert.deepEqual(fs.readdirSync(child), []);
  assert.throws(() => remember(d, "project"), /migration-required/);
  assert.throws(
    () => addMemoryType({ targetDir: d, name: "docs", description: "Docs" }),
    /migration-required/,
  );
  assert.ok(
    doctorMemory({ targetDir: d, apply: true }).remaining.some(
      (f) => f.code === "migration-required",
    ),
  );
  assert.equal(read(d, ".memory/projects/project_old.md"), "old");
  assert.equal(fs.existsSync(join(d, ".harness")), false);
});
for (const remove of ["index", "directory", "scope"])
  test(`doctor restores missing adopted ${remove} without expanding adoption`, (t) => {
    const d = base(t);
    fs.rmSync(
      join(
        d,
        remove === "index"
          ? pi
          : remove === "directory"
            ? ".harness/memory/projects"
            : "AGENTS.md",
      ),
      { recursive: true },
    );
    assert.equal(
      doctorMemory({ targetDir: d, apply: true }).remaining.length,
      0,
    );
    assert.deepEqual(
      layerTypeSpecs(d).map((s) => s.name),
      ["project"],
    );
  });
test("doctor never recreates missing custom permissions from path", (t) => {
  const d = base(t);
  addMemoryType({
    targetDir: d,
    name: "secrets",
    description: "Private",
    indexOnly: true,
    gitignore: true,
  });
  fs.unlinkSync(join(d, ".harness/memory/secrets/AGENTS.md"));
  assert.ok(
    doctorMemory({ targetDir: d, apply: true }).remaining.some(
      (f) => f.code === "unsafe-layout",
    ),
  );
  assert.equal(
    fs.existsSync(join(d, ".harness/memory/secrets/AGENTS.md")),
    false,
  );
});
test("foreign and manual prose remain byte-identical outside managed blocks", (t) => {
  const d = fixture(t),
    manual = "# Business\n\nManual body\n\n\n";
  put(d, "AGENTS.md", manual);
  assert.equal(
    initMemory({ targetDir: d, memoryTypes: ["project"] }).agentsAction,
    "needs-doctor",
  );
  assert.equal(read(d, "AGENTS.md"), manual);
  doctorMemory({ targetDir: d, apply: true });
  assert.ok(read(d, "AGENTS.md").startsWith(manual));
  const tail = "\n\n\nManual tail\n\n";
  put(d, "AGENTS.md", read(d, "AGENTS.md") + tail);
  initMemory({ targetDir: d });
  doctorMemory({ targetDir: d, apply: true });
  assert.ok(read(d, "AGENTS.md").endsWith(tail));
});
test("doctor fixes duplicate and misplaced children preserving description and prose", (t) => {
  const d = base(t),
    child = join(d, "mid/child");
  fs.mkdirSync(child, { recursive: true });
  initMemory({
    targetDir: child,
    rootDir: d,
    memoryTypes: ["project"],
    description: "specific responsibility",
  });
  const line = read(d, "AGENTS.md")
    .split("\n")
    .find((l) => l.includes("](mid/child/AGENTS.md)"))!;
  put(
    d,
    "AGENTS.md",
    read(d, "AGENTS.md").replace(line, `Manual guidance\n${line}\n${line}`),
  );
  initMemory({
    targetDir: dirname(child),
    rootDir: dirname(child),
    memoryTypes: ["project"],
  });
  assert.equal(doctorMemory({ targetDir: d, apply: true }).remaining.length, 0);
  assert.match(read(d, "AGENTS.md"), /Manual guidance/);
  assert.match(read(d, "mid/AGENTS.md"), /specific responsibility/);
  assert.equal(
    read(d, "mid/AGENTS.md").split("](child/AGENTS.md)").length - 1,
    1,
  );
});
test("doctor discovers harness child scope but skips containers and business AGENTS", (t) => {
  const d = base(t),
    child = join(d, ".harness/evaluation/suite");
  fs.mkdirSync(child, { recursive: true });
  initMemory({ targetDir: child, rootDir: child, skillTypes: ["managed"] });
  put(d, "tasks/AGENTS.md", "# Business");
  const report = doctorMemory({ targetDir: d, apply: true });
  assert.deepEqual(report.memoryDirs.sort(), [
    ".",
    ".harness/evaluation/suite",
  ]);
  assert.equal(report.remaining.length, 0);
});
test("unregistered custom types are rediscovered and metadata/manual introductions are preserved", (t) => {
  const d = base(t);
  addMemoryType({ targetDir: d, name: "docs", description: "Docs" });
  put(
    d,
    "AGENTS.md",
    read(d, "AGENTS.md").replace(
      /^- .*\.harness\/memory\/docs\/AGENTS.md.*\n/gm,
      "",
    ),
  );
  const index = ".harness/memory/docs/AGENTS.md";
  put(
    d,
    index,
    "Manual type preface\n" +
      read(d, index).replace("module: memory\n", "unknown-key: retain\n"),
  );
  assert.ok(
    doctorMemory({ targetDir: d }).findings.some(
      (f) => f.code === "unregistered-type",
    ),
  );
  doctorMemory({ targetDir: d, apply: true });
  remember(d, "docs");
  initMemory({ targetDir: d });
  assert.match(read(d, index), /unknown-key: retain/);
  assert.match(read(d, index), /^Manual type preface/);
  assert.match(read(d, "AGENTS.md"), /\.harness\/memory\/docs\/AGENTS.md/);
});
test("standard YAML parsing supports quoted, multiline and nested metadata; nested values win", (t) => {
  const d = base(t);
  const file = ".harness/memory/projects/project_yaml.md";
  put(
    d,
    file,
    '---\nname: project_yaml\ntitle: old\ndescription: >-\n  first line\n  second line\nmetadata:\n  edges-title: "new: title"\n  vendor:\n    list: [one, two]\n---\nBody\n',
  );
  assert.equal(
    parseFrontmatter(join(d, file)).description,
    "first line second line",
  );
  assert.equal(parseFrontmatter(join(d, file)).title, "new: title");
  rememberMemory({
    targetDir: d,
    type: "project",
    slug: "yaml",
    content: "Update",
  });
  assert.match(read(d, file), /vendor:/);
  assert.equal(parseFrontmatter(join(d, file)).title, "new: title");
});
test("remember provenance keeps origin, refreshes audit and honors explicit env snapshot", (t) => {
  const d = base(t);
  const first = rememberMemory({
    targetDir: d,
    type: "project",
    slug: "origin",
    title: "Origin",
    description: "Source",
    content: "one",
    env: { CURSOR_AGENT: "1", CURSOR_CONVERSATION_ID: "first" },
    username: "first",
    email: "first@example.test",
  });
  assert.equal(first.provenance.originSessionId, "first");
  const second = rememberMemory({
    targetDir: d,
    type: "project",
    slug: "origin",
    content: "two",
    env: { CLAUDECODE: "1", CLAUDE_SESSION_ID: "second" },
    username: "last",
    email: "last@example.test",
  });
  assert.equal(second.provenance.agentClient, "cursor");
  assert.equal(second.provenance.originSessionId, "first");
  assert.equal(second.provenance.username, "last");
});
test("slug and content validation fail before writing", (t) => {
  const d = base(t);
  for (const slug of ["../escape", "two-words", "project_prefixed", ""])
    assert.throws(() => remember(d, "project", slug));
  initMemory({ targetDir: d, skillTypes: ["managed"] });
  for (const slug of ["two_words", "x".repeat(65), "../escape"])
    assert.throws(() => remember(d, "managed", slug));
  assert.throws(() =>
    rememberMemory({
      targetDir: d,
      type: "project",
      slug: "empty",
      title: "Empty",
      description: "Empty",
      content: "  ",
    }),
  );
  assert.equal(
    fs.existsSync(join(d, ".harness/memory/projects/project_empty.md")),
    false,
  );
});
test("custom privilege YAML rejects string booleans and executable language headers stay inert", (t) => {
  assert.throws(
    () =>
      parseTypeMeta(
        '<!-- project-memory-type:start -->\nname: secrets\nwritable: "true"\ngitignore: false\n<!-- project-memory-type:end -->',
      ),
    /Invalid type flag/,
  );
  const d = base(t),
    file = ".harness/memory/projects/project_js.md";
  put(d, file, '---js\n{description: "should not execute"}\n---\nBody');
  assert.deepEqual(parseFrontmatter(join(d, file)), {});
  assert.ok(
    doctorMemory({ targetDir: d }).remaining.some(
      (f) => f.code === "invalid-entry",
    ),
  );
});
test("custom descriptions with YAML punctuation roundtrip without corrupting registration", (t) => {
  const d = base(t),
    description = "Docs: use # carefully";
  addMemoryType({ targetDir: d, name: "docs", description });
  assert.equal(
    layerTypeSpecs(d).find((s) => s.name === "docs")?.description,
    description,
  );
  remember(d, "docs");
  assert.equal(doctorMemory({ targetDir: d }).remaining.length, 0);
});
test("atomic private files keep owner-only creation mode", (t) => {
  const d = fixture(t);
  initMemory({ targetDir: d, memoryTypes: ["user"] });
  remember(d, "user");
  for (const path of [
    ".harness/memory/users/AGENTS.md",
    ".harness/memory/users/user_example.md",
  ])
    assert.equal(fs.statSync(join(d, path)).mode & 0o777, 0o600);
});
