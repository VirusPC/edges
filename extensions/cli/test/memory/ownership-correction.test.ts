import test from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
const load = () => import("../../../../scripts/restore-local-ownership.mts");
const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
function put(root: string, path: string, text: string) {
  fs.mkdirSync(join(root, path, ".."), { recursive: true });
  fs.writeFileSync(join(root, path), text);
}
function fixture(t: any) {
  const root = fs.realpathSync(fs.mkdtempSync(join(tmpdir(), "ownership-")));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  execFileSync("git", ["init", "-q", root]);
  const source = ".harness/memory/projects/project_child.md",
    target = "child/.harness/memory/projects/project_child.md";
  const latest =
    "---\nname: child\nmetadata:\n  vendor: keep\n---\nChanged after migration. [reference](../../../guide.md)\n";
  const after = latest.replace("../../../guide.md", "../../../../guide.md");
  put(root, source, latest);
  put(root, "guide.md", "guide");
  put(
    root,
    ".harness/memory/projects/project_root_new.md",
    "new independent root record",
  );
  const index = ".harness/memory/projects/AGENTS.md";
  put(root, index, "# Root manual\nchild and new root entries\n");
  put(
    root,
    ".gitignore",
    "**/.ownership-correction/\n**/.harness/memory/users/\n",
  );
  return {
    root,
    source,
    target,
    latest,
    after,
    manifest: {
      version: 1 as const,
      moves: [
        {
          source,
          target,
          sha256: digest(latest),
          after,
          afterSha256: digest(after),
        },
      ],
      edits: [
        {
          path: index,
          beforeSha256: digest(fs.readFileSync(join(root, index), "utf8")),
          after: "# Root manual\nnew root entry\n",
        },
        {
          path: "child/.harness/memory/projects/AGENTS.md",
          beforeSha256: null,
          after: "# Original custom instructions\nchild entry\n",
        },
      ],
      units: [] as { source: string; target: string; files: string[] }[],
    },
  };
}
function snapshot(root: string) {
  const result: Record<string, string> = {};
  function walk(dir: string) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name === ".git") continue;
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else result[p] = fs.readFileSync(p).toString("base64");
    }
  }
  walk(root);
  return result;
}
test("public correction dry-run is read-only; apply preserves latest bytes, manual text, root additions and is idempotent", async (t) => {
  const f = fixture(t),
    m = await load(),
    before = snapshot(f.root);
  assert.equal(
    m.runPublicCorrection(f.root, f.manifest, false).status,
    "dry-run",
  );
  assert.deepEqual(snapshot(f.root), before);
  assert.equal(
    m.runPublicCorrection(f.root, f.manifest, true).status,
    "restored",
  );
  assert.equal(fs.readFileSync(join(f.root, f.target), "utf8"), f.after);
  assert.equal(fs.existsSync(join(f.root, f.source)), false);
  assert.equal(
    fs.readFileSync(
      join(f.root, ".harness/memory/projects/project_root_new.md"),
      "utf8",
    ),
    "new independent root record",
  );
  assert.equal(
    fs.readFileSync(
      join(f.root, "child/.harness/memory/projects/AGENTS.md"),
      "utf8",
    ),
    "# Original custom instructions\nchild entry\n",
  );
  const done = snapshot(f.root);
  assert.equal(
    m.runPublicCorrection(f.root, f.manifest, true).status,
    "unchanged",
  );
  assert.deepEqual(snapshot(f.root), done);
});
for (const kind of ["source", "target", "index"] as const)
  test(`public correction refuses ${kind} drift before any mutation`, async (t) => {
    const f = fixture(t),
      m = await load();
    put(
      f.root,
      kind === "source"
        ? f.source
        : kind === "target"
          ? f.target
          : f.manifest.edits[0]!.path,
      "unexpected edit",
    );
    const before = snapshot(f.root);
    assert.throws(
      () => m.runPublicCorrection(f.root, f.manifest, true),
      /conflict|mismatch/,
    );
    assert.deepEqual(snapshot(f.root), before);
  });
test("public correction refuses undeclared Skill assets and unsafe/protected paths", async (t) => {
  const f = fixture(t),
    m = await load();
  put(f.root, ".harness/skills/managed/demo/SKILL.md", "skill");
  put(f.root, ".harness/skills/managed/demo/new-resource.txt", "unreviewed");
  f.manifest.units.push({
    source: ".harness/skills/managed/demo",
    target: "child/.harness/skills/managed/demo",
    files: ["SKILL.md"],
  });
  assert.throws(() => m.runPublicCorrection(f.root, f.manifest, true), /unit/);
  f.manifest.units = [];
  f.manifest.moves[0]!.target = "../outside.md";
  assert.throws(() => m.runPublicCorrection(f.root, f.manifest, true), /path/);
  f.manifest.moves[0]!.target = "knowledge/posts/forbidden.md";
  assert.throws(
    () => m.runPublicCorrection(f.root, f.manifest, true),
    /protected/,
  );
});
test("public correction never opens an existing private migration journal", async (t) => {
  const f = fixture(t),
    m = await load();
  put(
    f.root,
    ".recursive-layout-migration/journal.json",
    "invalid private journal; do not read",
  );
  m.runPublicCorrection(f.root, f.manifest, true);
  assert.equal(
    fs.readFileSync(
      join(f.root, ".recursive-layout-migration/journal.json"),
      "utf8",
    ),
    "invalid private journal; do not read",
  );
});
async function privateFixture(t: any) {
  const f = fixture(t),
    g = await import("../../src/services/memory/migrate.js");
  const from = "extensions/.memory/secrets",
    current = ".harness/memory/secrets",
    target = "extensions/.harness/memory/secrets";
  const intro =
    "<!-- project-memory-type:start -->\nname: secret\nmodule: memory\nwritable: true\ngitignore: true\nformat: ordinary\n<!-- project-memory-type:end -->\n# Private custom guidance\n<!-- project-memory-entries:start -->\n- [x](secret_x.md) — x\n<!-- project-memory-entries:end -->\n";
  const operations = ["AGENTS.md", "secret_x.md"].map((name) => {
    const text = name === "AGENTS.md" ? intro : "private fixture bytes";
    put(f.root, `${current}/${name}`, text);
    fs.chmodSync(join(f.root, current, name), 0o600);
    return {
      source: join(f.root, from, name),
      target: join(f.root, current, name),
      before: g.fileState(text, 0o600),
      after: g.fileState(text, 0o600),
      originalTarget: null,
    };
  });
  put(f.root, "extensions/AGENTS.md", "# extensions\n");
  put(
    f.root,
    "AGENTS.md",
    "# root\n<!-- project-memory-local:start -->\n- [secret](.harness/memory/secrets/AGENTS.md) — private\n<!-- project-memory-local:end -->\n",
  );
  put(
    f.root,
    ".gitignore",
    "**/.ownership-correction/\n**/.recursive-layout-migration/\n**/.harness/memory/secrets/\n",
  );
  fs.chmodSync(join(f.root, current), 0o700);
  const journal = {
    root: f.root,
    phase: "done",
    operations,
    private: [join(f.root, current)],
    directories: [
      {
        target: join(f.root, current),
        mode: 0o700,
        beforeMode: null,
        sources: [{ source: join(f.root, from), mode: 0o700 }],
      },
    ],
    legacyOwners: ["extensions"],
    watchedSources: operations.map((op) => op.source),
    diagnostics: [],
    protected: {},
    gitlink: null,
  };
  put(
    f.root,
    ".recursive-layout-migration/journal.json",
    JSON.stringify(journal),
  );
  fs.chmodSync(join(f.root, ".recursive-layout-migration"), 0o700);
  fs.chmodSync(join(f.root, ".recursive-layout-migration/journal.json"), 0o600);
  return { ...f, current, target, journal };
}
test("private correction requires explicit valid provenance and restores custom private types with safe modes", async (t) => {
  const f = await privateFixture(t),
    m = await load(),
    before = snapshot(f.root);
  assert.equal(m.runPrivateCorrection(f.root, false).status, "dry-run");
  assert.deepEqual(snapshot(f.root), before);
  const result = m.runPrivateCorrection(f.root, true);
  assert.equal(result.status, "restored");
  assert.doesNotMatch(JSON.stringify(result), /private fixture bytes/);
  assert.equal(
    fs.readFileSync(join(f.root, f.target, "secret_x.md"), "utf8"),
    "private fixture bytes",
  );
  assert.equal(fs.statSync(join(f.root, f.target)).mode & 0o777, 0o700);
  assert.equal(
    fs.statSync(join(f.root, f.target, "secret_x.md")).mode & 0o777,
    0o600,
  );
  assert.equal(fs.existsSync(join(f.root, f.current, "secret_x.md")), false);
  assert.match(
    fs.readFileSync(join(f.root, "extensions/AGENTS.md"), "utf8"),
    /secrets\/AGENTS.md/,
  );
  execFileSync("git", [
    "-C",
    f.root,
    "check-ignore",
    "-q",
    "--no-index",
    join(f.root, f.target, "secret_x.md"),
  ]);
  assert.equal(m.runPrivateCorrection(f.root, true).status, "unchanged");
});
for (const kind of [
  "edited",
  "extra-asset",
  "retire",
  "missing-directory",
  "occupied",
  "missing-journal",
] as const)
  test(`private correction reports ${kind} provenance without any mutation`, async (t) => {
    const f = await privateFixture(t),
      m = await load();
    if (kind === "edited")
      put(f.root, `${f.current}/secret_x.md`, "new private edit");
    if (kind === "extra-asset")
      put(f.root, `${f.current}/extra.bin`, "unattributed asset");
    if (kind === "occupied") put(f.root, `${f.target}/secret_x.md`, "occupied");
    if (kind === "retire")
      (f.journal.operations[0] as any).retire = [
        {
          source: join(f.root, ".memory/secrets/AGENTS.md"),
          before: f.journal.operations[0]!.before,
        },
      ];
    if (kind === "missing-directory") f.journal.directories = [];
    if (["retire", "missing-directory"].includes(kind))
      fs.writeFileSync(
        join(f.root, ".recursive-layout-migration/journal.json"),
        JSON.stringify(f.journal),
      );
    if (kind === "missing-journal")
      fs.unlinkSync(join(f.root, ".recursive-layout-migration/journal.json"));
    const before = snapshot(f.root);
    const result = m.runPrivateCorrection(f.root, true);
    assert.equal(result.status, "needs-review");
    assert.ok(result.unresolved.length);
    assert.deepEqual(snapshot(f.root), before);
  });

test("public correction resumes after a copied destination and refuses edited completed destinations", async (t) => {
  const f = fixture(t),
    m = await load();
  put(f.root, f.target, f.after);
  assert.equal(
    m.runPublicCorrection(f.root, f.manifest, true).status,
    "restored",
  );
  put(f.root, f.target, "later edit");
  const before = snapshot(f.root);
  assert.throws(
    () => m.runPublicCorrection(f.root, f.manifest, true),
    /conflict/,
  );
  assert.deepEqual(snapshot(f.root), before);
});
test("maintained public correction manifest restores every reviewed record and public type index in a disposable fixture", async (t) => {
  const m = await load();
  const repo = join(import.meta.dirname, "../../../..");
  const manifest = JSON.parse(
    fs.readFileSync(
      join(
        repo,
        "docs/superpowers/plans/2026-10-05-local-ownership-correction.json",
      ),
      "utf8",
    ),
  );
  const f = fixture(t);
  // Only explicitly reviewed public sources and before-edit paths; never private filesystem discovery.
  for (const move of manifest.moves) put(f.root, move.source, move.before);
  for (const edit of manifest.edits)
    if (edit.beforeSha256 !== null) put(f.root, edit.path, edit.before);
  const before = snapshot(f.root);
  assert.equal(
    m.runPublicCorrection(f.root, manifest, false).operations,
    manifest.moves.length + manifest.edits.length,
  );
  assert.deepEqual(snapshot(f.root), before);
  m.runPublicCorrection(f.root, manifest, true);
  for (const move of manifest.moves) {
    assert.equal(
      digest(fs.readFileSync(join(f.root, move.target), "utf8")),
      move.afterSha256,
    );
    assert.equal(fs.existsSync(join(f.root, move.source)), false);
  }
  for (const edit of manifest.edits)
    assert.equal(fs.readFileSync(join(f.root, edit.path), "utf8"), edit.after);
  assert.equal(manifest.moves.length, 43);
  assert.equal(manifest.introductions.length, 25);
  const { LegacyIndex: AgentsNode } =
    await import("../../../../scripts/legacy-index.mjs");
  for (const owner of [
    "extensions",
    "extensions/skills/project-memory-init",
    "shared-extensions",
    "knowledge/notes",
    ".harness/tasks",
  ]) {
    const node = new AgentsNode(join(f.root, owner, "AGENTS.md")).parse(
      fs.readFileSync(join(f.root, owner, "AGENTS.md"), "utf8"),
    );
    assert.equal(
      node.children.filter((c) => c.target.startsWith(".harness/")).length,
      5,
    );
    assert.equal(
      node.children.some((c) => c.target.includes("/users/")),
      false,
    );
  }
  const { expectedIndexDocument } =
    await import("../../src/services/memory/entries.js");
  const { parseTypeMeta } = await import("../../src/services/memory/types.js");
  for (const intro of manifest.introductions) {
    const owner = intro.restoredIndex.slice(
      0,
      intro.restoredIndex.lastIndexOf("/.harness/"),
    );
    const text = fs.readFileSync(join(f.root, intro.restoredIndex), "utf8");
    const type = parseTypeMeta(text)!;
    if (type.name === "referenced")
      fs.mkdirSync(join(f.root, owner, ".agents/skills"), { recursive: true });
    // Historical manifests remain byte-exact legacy evidence; runtime indexes intentionally ignore plain .md.
    const historical = new AgentsNode(
      join(f.root, intro.restoredIndex),
    ).parse(text);
    for (const child of historical.children)
      assert.ok(fs.existsSync(child.id), child.id);
  }
  assert.equal(
    m.runPublicCorrection(f.root, manifest, true).status,
    "unchanged",
  );
});
async function interruptPrivate(f: Awaited<ReturnType<typeof privateFixture>>) {
  const moduleUrl = new URL(
    "../../../../scripts/restore-local-ownership.mts",
    import.meta.url,
  ).href;
  const code = `import fs from 'node:fs';import {syncBuiltinESMExports} from 'node:module';const unlink=fs.unlinkSync;fs.unlinkSync=(path)=>{if(String(path).endsWith('/.harness/memory/secrets/AGENTS.md'))throw Error('injected-before-retire');return unlink(path);};syncBuiltinESMExports();const m=await import(${JSON.stringify(moduleUrl)});m.runPrivateCorrection(${JSON.stringify(f.root)},true);`;
  assert.throws(
    () =>
      execFileSync(
        process.execPath,
        ["--import", "tsx", "--input-type=module", "-e", code],
        { stdio: "pipe" },
      ),
    /Error: injected-before-retire/,
  );
}
test("private correction resumes a verified copy interruption without leaking or losing snapshots", async (t) => {
  const f = await privateFixture(t),
    m = await load();
  await interruptPrivate(f);
  assert.equal(fs.existsSync(join(f.root, f.current, "secret_x.md")), true);
  assert.equal(m.runPrivateCorrection(f.root, true).status, "restored");
  assert.equal(
    fs.readFileSync(join(f.root, f.target, "secret_x.md"), "utf8"),
    "private fixture bytes",
  );
});
test("private correction rejects an unrecorded resource added after interruption", async (t) => {
  const f = await privateFixture(t),
    m = await load();
  await interruptPrivate(f);
  put(f.root, `${f.target}/new.bin`, "new resource");
  const before = snapshot(f.root);
  assert.equal(m.runPrivateCorrection(f.root, true).status, "needs-review");
  assert.deepEqual(snapshot(f.root), before);
});

function publicModeFixture(t: any) {
  const f = fixture(t);
  const manifest = {
    ...f.manifest,
    moves: f.manifest.moves.map((move) => ({ ...move, mode: 0o644 })),
    edits: f.manifest.edits.map((edit) => ({ ...edit, mode: 0o644 })),
  };
  fs.chmodSync(join(f.root, f.source), 0o600);
  fs.chmodSync(join(f.root, manifest.edits[0]!.path), 0o600);
  return { ...f, manifest };
}
async function interruptPublic(f: ReturnType<typeof publicModeFixture>) {
  const moduleUrl = new URL(
    "../../../../scripts/restore-local-ownership.mts",
    import.meta.url,
  ).href;
  const code = `import fs from 'node:fs';import {syncBuiltinESMExports} from 'node:module';const unlink=fs.unlinkSync;fs.unlinkSync=(path)=>{if(String(path)===${JSON.stringify(join(f.root, f.source))})throw Error('injected-before-retire');return unlink(path);};syncBuiltinESMExports();const m=await import(${JSON.stringify(moduleUrl)});m.runPublicCorrection(${JSON.stringify(f.root)},${JSON.stringify(f.manifest)},true);`;
  assert.throws(
    () =>
      execFileSync(
        process.execPath,
        ["--import", "tsx", "--input-type=module", "-e", code],
        { stdio: "pipe" },
      ),
    /Error: injected-before-retire/,
  );
}
test("public correction preserves clone-local source and existing index modes instead of preparation checkout modes", async (t) => {
  const f = publicModeFixture(t),
    m = await load(),
    before = snapshot(f.root);
  assert.equal(
    m.runPublicCorrection(f.root, f.manifest, false).status,
    "dry-run",
  );
  assert.deepEqual(snapshot(f.root), before);
  assert.equal(
    m.runPublicCorrection(f.root, f.manifest, true).status,
    "restored",
  );
  assert.equal(fs.statSync(join(f.root, f.target)).mode & 0o777, 0o600);
  assert.equal(
    fs.statSync(join(f.root, f.manifest.edits[0]!.path)).mode & 0o777,
    0o600,
  );
  assert.equal(
    fs.statSync(join(f.root, f.manifest.edits[1]!.path)).mode & 0o777,
    0o644,
  );
  const journal = JSON.parse(
    fs.readFileSync(join(f.root, ".ownership-correction/public.json"), "utf8"),
  );
  assert.equal(
    journal.operations.find((op: any) => op.source === join(f.root, f.source))
      .before.mode,
    0o600,
  );
  assert.equal(
    journal.operations.find(
      (op: any) => op.source === join(f.root, f.manifest.edits[0]!.path),
    ).before.mode,
    0o600,
  );
  assert.equal(
    m.runPublicCorrection(f.root, f.manifest, true).status,
    "unchanged",
  );
  fs.chmodSync(join(f.root, f.target), 0o644);
  assert.throws(
    () => m.runPublicCorrection(f.root, f.manifest, true),
    /conflict|mismatch/,
  );
});
test("public mode snapshots survive interruption and reject later source and edited-index mode drift", async (t) => {
  const f = publicModeFixture(t),
    m = await load();
  await interruptPublic(f);
  fs.chmodSync(join(f.root, f.source), 0o644);
  assert.throws(
    () => m.runPublicCorrection(f.root, f.manifest, true),
    /conflict|mismatch/,
  );
  fs.chmodSync(join(f.root, f.source), 0o600);
  fs.chmodSync(join(f.root, f.manifest.edits[0]!.path), 0o644);
  assert.throws(
    () => m.runPublicCorrection(f.root, f.manifest, true),
    /conflict|mismatch/,
  );
  fs.chmodSync(join(f.root, f.manifest.edits[0]!.path), 0o600);
  assert.equal(
    m.runPublicCorrection(f.root, f.manifest, true).status,
    "restored",
  );
  assert.equal(fs.statSync(join(f.root, f.target)).mode & 0o777, 0o600);
  assert.equal(
    m.runPublicCorrection(f.root, f.manifest, true).status,
    "unchanged",
  );
});
async function privateAsset(
  f: Awaited<ReturnType<typeof privateFixture>>,
  name: string,
  bytes: Buffer | string,
  mode = 0o600,
) {
  const g = await import("../../src/services/memory/migrate.js");
  const path = join(f.root, f.current, name);
  fs.writeFileSync(path, bytes);
  fs.chmodSync(path, mode);
  f.journal.operations.push({
    source: join(f.root, "extensions/.memory/secrets", name),
    target: path,
    before: g.fileState(bytes, mode),
    after: g.fileState(bytes, mode),
    originalTarget: null,
  });
  f.journal.watchedSources = f.journal.operations.map((op) => op.source);
  fs.writeFileSync(
    join(f.root, ".recursive-layout-migration/journal.json"),
    JSON.stringify(f.journal),
  );
}
for (const [name, bytes] of [
  ["asset.bin", Buffer.from([0xff, 0x00, 0xfe, 0x80])],
  ["config.json", Buffer.from('{"pattern":"[x](../../../README.md)"}\n')],
] as const)
  test(`private correction preserves opaque ${name} bytes through apply and resume`, async (t) => {
    const f = await privateFixture(t),
      m = await load();
    await privateAsset(f, name, bytes);
    await privateAsset(f, "linked.md", "[x](../../../README.md)\n");
    await interruptPrivate(f);
    assert.deepEqual(fs.readFileSync(join(f.root, f.target, name)), bytes);
    assert.equal(m.runPrivateCorrection(f.root, true).status, "restored");
    assert.deepEqual(fs.readFileSync(join(f.root, f.target, name)), bytes);
    assert.equal(
      fs.readFileSync(join(f.root, f.target, "linked.md"), "utf8"),
      "[x](../../../../README.md)\n",
    );
    assert.equal(m.runPrivateCorrection(f.root, true).status, "unchanged");
  });
test("private correction retains owner execution and ordinary private modes through interrupted apply", async (t) => {
  const f = await privateFixture(t),
    m = await load();
  await privateAsset(f, "run.sh", "#!/bin/sh\nprintf fixture-ok\n", 0o700);
  await interruptPrivate(f);
  assert.equal(
    fs.statSync(join(f.root, f.target, "run.sh")).mode & 0o777,
    0o700,
  );
  assert.equal(m.runPrivateCorrection(f.root, true).status, "restored");
  assert.equal(
    fs.statSync(join(f.root, f.target, "secret_x.md")).mode & 0o777,
    0o600,
  );
  assert.equal(
    execFileSync(join(f.root, f.target, "run.sh"), { encoding: "utf8" }),
    "fixture-ok",
  );
  assert.equal(m.runPrivateCorrection(f.root, true).status, "unchanged");
});
test("public Skill unit preserves actual directory mode across clones and repeat", async (t) => {
  const f = fixture(t),
    m = await load();
  const source = ".harness/skills/managed/demo",
    target = "child/.harness/skills/managed/demo";
  put(f.root, `${source}/SKILL.md`, f.latest);
  fs.chmodSync(join(f.root, source), 0o700);
  const manifest = {
    ...f.manifest,
    moves: [
      {
        ...f.manifest.moves[0]!,
        source: `${source}/SKILL.md`,
        target: `${target}/SKILL.md`,
      },
    ],
    units: [{ source, target, files: ["SKILL.md"], mode: 0o755 }],
  };
  assert.equal(
    m.runPublicCorrection(f.root, manifest, true).status,
    "restored",
  );
  assert.equal(fs.statSync(join(f.root, target)).mode & 0o777, 0o700);
  assert.equal(
    m.runPublicCorrection(f.root, manifest, true).status,
    "unchanged",
  );
  fs.chmodSync(join(f.root, target), 0o755);
  assert.throws(
    () => m.runPublicCorrection(f.root, manifest, true),
    /unit-mode-conflict/,
  );
});

for (const [spelling, href] of [
  ["fragment", ".harness/memory/secrets/AGENTS.md#private"],
  ["query", ".harness/memory/secrets/AGENTS.md?view=private"],
  ["encoded", ".harness/memory/%73ecrets/AGENTS.md"],
] as const) {
  for (const location of ["old root", "destination"] as const) {
    test(`private correction resolves ${spelling} ${location} ownership and preserves traversal on repeat`, async (t) => {
      const f = await privateFixture(t),
        m = await load();
      const { LegacyIndex: AgentsNode } =
        await import("../../../../scripts/legacy-index.mjs");
      const { NodeService } =
        await import("../../src/services/node/node-service.js");
      const rootEntry = join(f.root, "AGENTS.md"),
        ownerEntry = join(f.root, "extensions/AGENTS.md");
      let rootSource = fs.readFileSync(rootEntry, "utf8");
      if (location === "old root")
        rootSource = rootSource.replace(
          ".harness/memory/secrets/AGENTS.md",
          href,
        );
      rootSource +=
        "<!-- project-memory-children:start -->\n- [owner](extensions/AGENTS.md)\n<!-- project-memory-children:end -->\n";
      fs.writeFileSync(rootEntry, rootSource);
      const ownerSource = `# extensions\n<!-- authored: preserve -->\n<!-- project-memory-local:start -->\n- [authored secret](<${href}>) — authored description\n<!-- project-memory-local:end -->\n`;
      if (location === "destination") fs.writeFileSync(ownerEntry, ownerSource);
      const before = snapshot(f.root);
      assert.equal(m.runPrivateCorrection(f.root, false).status, "dry-run");
      assert.deepEqual(snapshot(f.root), before);
      assert.equal(m.runPrivateCorrection(f.root, true).status, "restored");
      assert.equal(
        new AgentsNode(rootEntry)
          .parse(fs.readFileSync(rootEntry, "utf8"))
          .children.filter((c) => c.kind === "local").length,
        0,
      );
      const ownerAfter = fs.readFileSync(ownerEntry, "utf8");
      const owner = new AgentsNode(ownerEntry).parse(ownerAfter);
      assert.equal(owner.children.filter((c) => c.kind === "local").length, 1);
      if (location === "destination") assert.equal(ownerAfter, ownerSource);
      assert.equal(fs.existsSync(join(f.root, f.current, "AGENTS.md")), false);
      const expected = [
        rootEntry,
        ownerEntry,
        join(f.root, f.target, "AGENTS.md"),
        // Legacy secret_x.md remains an explicit migration document, not a production node.
      ].sort();
      const list = async () =>
        (
          await new NodeService({ managedRoot: f.root }).list(f.root)
        )
          .map((node) => node.path)
          .sort();
      assert.deepEqual(await list(), expected);
      const restored = snapshot(f.root);
      assert.equal(m.runPrivateCorrection(f.root, true).status, "unchanged");
      assert.deepEqual(snapshot(f.root), restored);
      assert.deepEqual(await list(), expected);
    });
  }
}
