import test from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
const modulePath = "../../src/services/memory/migrate.js";
const load = () => import(modulePath);
const entries =
  "<!-- project-memory-entries:start -->\n- 暂无条目。\n<!-- project-memory-entries:end -->\n";
function put(root: string, rel: string, data: string | Buffer) {
  const p = join(root, rel);
  fs.mkdirSync(join(p, ".."), { recursive: true });
  fs.writeFileSync(p, data);
  return p;
}
function fixture(t: any, kinds = ["project", "user", "skills"]) {
  const root = fs.realpathSync(fs.mkdtempSync(join(tmpdir(), "memory-port-")));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  execFileSync("git", ["init", "-q", root]);
  legacy(root, kinds);
  return root;
}
function legacy(root: string, kinds: string[]) {
  const dirs: Record<string, string> = {
    project: "projects",
    user: "users",
    skills: "skills",
    agent_skills: "agent_skills",
  };
  const links = kinds.map((k) => {
    const rel = `.memory/${dirs[k] ?? k}/AGENTS.md`;
    put(root, rel, `# ${k}\nmanual intro\n${entries}`);
    return `- [${k}](${rel}) — test`;
  });
  put(
    root,
    "AGENTS.md",
    `# Manual\n<!-- project-memory:start -->\n<!-- project-memory-local:start -->\n${links.join("\n")}\n<!-- project-memory-local:end -->\n<!-- project-memory-children:start -->\n<!-- project-memory-children:end -->\n<!-- project-memory:end -->\n`,
  );
}
function snapshot(root: string): unknown {
  const result: Record<string, unknown> = {};
  function walk(p: string) {
    for (const n of fs.readdirSync(p).sort()) {
      if (n === ".git") continue;
      const f = join(p, n),
        s = fs.lstatSync(f);
      result[f.slice(root.length)] = {
        mode: s.mode & 0o7777,
        data: s.isSymbolicLink()
          ? fs.readlinkSync(f)
          : s.isFile()
            ? fs.readFileSync(f).toString("base64")
            : null,
      };
      if (s.isDirectory()) walk(f);
    }
  }
  walk(root);
  return result;
}
test("dry run leaves every byte and directory untouched", async (t) => {
  const root = fixture(t),
    before = snapshot(root);
  const m = await load();
  const r = m.migrateMemory({ targetDir: root, dryRun: true });
  assert.equal(r.status, "dry-run");
  assert.ok(r.pathMap.length);
  assert.deepEqual(snapshot(root), before);
});
test("moves private bytes, assets and modes and repeats without mutation", async (t) => {
  const root = fixture(t);
  const data = Buffer.from([0, 255, 13, 10]);
  put(
    root,
    ".memory/users/user_private.md",
    "---\r\nunknown: yes\r\n---\r\nsecret\0\n",
  );
  const asset = put(root, ".memory/skills/method/assets/data.bin", data);
  fs.chmodSync(asset, 0o751);
  put(
    root,
    ".memory/skills/method/SKILL.md",
    "---\nname: method\ndescription: method\nmetadata:\n  edges-type: skills\n  vendor: keep\n---\nbody\n",
  );
  const m = await load();
  assert.equal(
    m.migrateMemory({ targetDir: root, recursive: true }).status,
    "migrated",
  );
  assert.deepEqual(
    fs.readFileSync(
      join(root, ".harness/skills/managed/method/assets/data.bin"),
    ),
    data,
  );
  assert.equal(
    fs.statSync(join(root, ".harness/skills/managed/method/assets/data.bin"))
      .mode & 0o777,
    0o751,
  );
  assert.match(
    fs.readFileSync(
      join(root, ".harness/skills/managed/method/SKILL.md"),
      "utf8",
    ),
    /edges-type: managed/,
  );
  assert.equal(
    fs.readFileSync(
      join(root, ".harness/memory/users/user_private.md"),
      "utf8",
    ),
    "---\r\nunknown: yes\r\n---\r\nsecret\0\n",
  );
  assert.equal(fs.existsSync(join(root, ".memory")), false);
  execFileSync("git", [
    "-C",
    root,
    "check-ignore",
    "-q",
    ".harness/memory/users/AGENTS.md",
  ]);
  const before = snapshot(root);
  m.migrateMemory({ targetDir: root, recursive: true });
  assert.deepEqual(snapshot(root), before);
});
test("recursive conflicts reject before ignore or journal writes", async (t) => {
  const root = fixture(t);
  legacy(join(root, "deep"), ["project"]);
  put(root, "deep/.harness/unrelated", "keep");
  const before = snapshot(root),
    m = await load();
  assert.throws(
    () => m.migrateMemory({ targetDir: root, recursive: true }),
    /conflict/,
  );
  assert.deepEqual(snapshot(root), before);
});
test("nested moving scope and installation symlink are mapped once", async (t) => {
  const root = fixture(t, ["skills"]);
  legacy(join(root, ".memory/skills/method"), ["project"]);
  put(
    root,
    ".memory/skills/method/SKILL.md",
    "---\nname: method\ndescription: x\n---\n",
  );
  put(root, ".memory/skills/method/.memory/projects/project_x.md", "body");
  fs.mkdirSync(join(root, ".agents/skills"), { recursive: true });
  fs.symlinkSync(
    "../../.memory/skills/method",
    join(root, ".agents/skills/alias"),
  );
  const m = await load();
  assert.throws(
    () => m.migrateMemory({ targetDir: root }),
    /requires-recursive/,
  );
  m.migrateMemory({ targetDir: root, recursive: true });
  assert.equal(
    fs.readFileSync(
      join(
        root,
        ".harness/skills/managed/method/.harness/memory/projects/project_x.md",
      ),
      "utf8",
    ),
    "body",
  );
  assert.equal(
    fs.realpathSync(join(root, ".agents/skills/alias")),
    join(root, ".harness/skills/managed/method"),
  );
});
test("custom privileges and unknown index metadata survive conversion", async (t) => {
  const root = fixture(t, ["docs"]);
  put(
    root,
    ".memory/docs/AGENTS.md",
    "<!-- project-memory-type:start -->\nname: docs\nmodule: skills\nwritable: false\ngitignore: true\nformat: ordinary\nunknown: keep\n<!-- project-memory-type:end -->\nmanual\n" +
      entries,
  );
  put(
    root,
    ".memory/docs/docs_x.md",
    "---\nname: x\ndescription: desc\n---\nbody",
  );
  const m = await load();
  m.migrateMemory({ targetDir: root });
  const index = fs.readFileSync(
    join(root, ".harness/skills/docs/AGENTS.md"),
    "utf8",
  );
  assert.match(index, /unknown: keep/);
  assert.match(index, /writable: false/);
  assert.match(index, /\[x\]\(docs_x.md\) — desc/);
});
test("referenced source absence preserves old entries and reports incomplete", async (t) => {
  const root = fixture(t, ["agent_skills"]);
  put(
    root,
    ".memory/agent_skills/AGENTS.md",
    entries.replace(
      "- 暂无条目。",
      "- [kept](../../.agents/skills/missing/SKILL.md) — kept",
    ),
  );
  const m = await load();
  assert.equal(
    m.migrateMemory({ targetDir: root }).status,
    "migrated-incomplete",
  );
  assert.match(
    fs.readFileSync(join(root, ".harness/skills/referenced/AGENTS.md"), "utf8"),
    /\[kept\]/,
  );
  assert.equal(m.migrateMemory({ targetDir: root }).complete, false);
});
test("existing restrictive ancestry is retained for private destination", async (t) => {
  const root = fixture(t, ["user"]);
  fs.chmodSync(join(root, ".memory"), 0o700);
  fs.chmodSync(join(root, ".memory/users"), 0o750);
  put(root, ".memory/users/user_x.md", "secret");
  const m = await load();
  m.migrateMemory({ targetDir: root });
  assert.equal(
    fs.statSync(join(root, ".harness/memory/users")).mode & 0o777,
    0o700,
  );
});
test("saved planned journal resumes while later edits refuse without mutation", async (t) => {
  const root = fixture(t, ["project"]);
  put(root, ".memory/projects/project_x.md", "before");
  const m = await load();
  const job = {
    ...m.planMigration(root, false),
    target: root,
    recursive: false,
    phase: "planned",
  };
  put(root, ".project-memory-migration/journal.json", JSON.stringify(job));
  put(root, ".memory/projects/project_x.md", "newer");
  const before = snapshot(root);
  assert.throws(
    () => m.migrateMemory({ targetDir: root }),
    /resume-source-edited/,
  );
  assert.deepEqual(snapshot(root), before);
  put(root, ".memory/projects/project_x.md", "before");
  assert.equal(m.migrateMemory({ targetDir: root }).status, "migrated");
});
test("legacy journal missing permission inventory requires review", async (t) => {
  const root = fixture(t, ["user"]);
  const m = await load();
  const job = {
    ...m.planMigration(root, false),
    target: root,
    recursive: false,
    phase: "planned",
  };
  delete job.sourceDirectoryModes;
  put(root, ".project-memory-migration/journal.json", JSON.stringify(job));
  const before = snapshot(root);
  assert.throws(
    () => m.migrateMemory({ targetDir: root }),
    /permissions-missing/,
  );
  assert.deepEqual(snapshot(root), before);
});
test("new source assets after planning prevent retirement", async (t) => {
  const root = fixture(t, ["project"]),
    m = await load();
  const job = {
    ...m.planMigration(root, false),
    target: root,
    recursive: false,
    phase: "planned",
  };
  put(root, ".project-memory-migration/journal.json", JSON.stringify(job));
  put(root, ".memory/projects/added.bin", "added");
  const before = snapshot(root);
  assert.throws(() => m.migrateMemory({ targetDir: root }), /source-added/);
  assert.deepEqual(snapshot(root), before);
});
test("linked destination ancestor refuses before mutation", async (t) => {
  const root = fixture(t, ["user"]);
  fs.symlinkSync(join(root, ".memory"), join(root, ".harness"));
  const before = snapshot(root),
    m = await load();
  assert.throws(
    () => m.migrateMemory({ targetDir: root }),
    /symbolic link|symlink/,
  );
  assert.deepEqual(snapshot(root), before);
});
test("link rebasing preserves code examples and fragments", async () => {
  const m = await load();
  const result = m.rewriteLinks(
    "[`x`](asset.png#x)\n`[x](asset.png)`\n```\n[x](asset.png)\n```",
    "/root/old/doc.md",
    "/root/new/deep/doc.md",
    (p: string) => (p === "/root/old/asset.png" ? "/root/new/asset.png" : p),
  );
  assert.equal(
    result,
    "[`x`](../asset.png#x)\n`[x](asset.png)`\n```\n[x](asset.png)\n```",
  );
});

// These cases protect the preflight boundary: none may create an ignore or journal.
for (const [name, fields] of [
  ["missing custom privileges", "name: docs\n"],
  ["invalid boolean", "name: docs\nwritable: sometimes\ngitignore: false\n"],
  [
    "unsupported module",
    "name: docs\nwritable: true\ngitignore: false\nmodule: tasks\n",
  ],
  [
    "new official name collision",
    "name: managed\nwritable: true\ngitignore: false\n",
  ],
  [
    "duplicate yaml privilege",
    "name: docs\nwritable: true\nwritable: false\ngitignore: false\n",
  ],
])
  test(`${name} refuses without mutation`, async (t) => {
    const root = fixture(t, ["docs"]);
    put(
      root,
      ".memory/docs/AGENTS.md",
      `<!-- project-memory-type:start -->\n${fields}<!-- project-memory-type:end -->\n${entries}`,
    );
    const before = snapshot(root),
      m = await load();
    assert.throws(() => m.migrateMemory({ targetDir: root }));
    assert.deepEqual(snapshot(root), before);
  });
for (const name of ["project", "user", "skills", "agent_skills"])
  test(`official ${name} cannot change its module`, async (t) => {
    const root = fixture(t, [name]),
      dir = {
        project: "projects",
        user: "users",
        skills: "skills",
        agent_skills: "agent_skills",
      }[name]!;
    put(
      root,
      `.memory/${dir}/AGENTS.md`,
      `<!-- project-memory-type:start -->\nname: ${name}\nmodule: ${["skills", "agent_skills"].includes(name) ? "memory" : "skills"}\n<!-- project-memory-type:end -->\n${entries}`,
    );
    const before = snapshot(root),
      m = await load();
    assert.throws(
      () => m.migrateMemory({ targetDir: root }),
      /ambiguous-legacy-module/,
    );
    assert.deepEqual(snapshot(root), before);
  });
test("empty assets and dependency-named owned directories are copied", async (t) => {
  const root = fixture(t, ["skills"]);
  fs.mkdirSync(join(root, ".memory/skills/tool/assets/empty"), {
    recursive: true,
  });
  fs.chmodSync(join(root, ".memory/skills/tool/assets/empty"), 0o710);
  put(
    root,
    ".memory/skills/tool/node_modules/owned.bin",
    Buffer.from([255, 0]),
  );
  put(root, ".memory/skills/tool/.project-memory-migration/owned.bin", "owned");
  const m = await load();
  m.migrateMemory({ targetDir: root });
  assert.equal(
    fs.statSync(join(root, ".harness/skills/managed/tool/assets/empty")).mode &
      0o777,
    0o710,
  );
  assert.deepEqual(
    fs.readFileSync(
      join(root, ".harness/skills/managed/tool/node_modules/owned.bin"),
    ),
    Buffer.from([255, 0]),
  );
  assert.equal(
    fs.readFileSync(
      join(
        root,
        ".harness/skills/managed/tool/.project-memory-migration/owned.bin",
      ),
      "utf8",
    ),
    "owned",
  );
});
test("owned nested repositories refuse retirement and preserve all content", async (t) => {
  const root = fixture(t, ["skills"]);
  put(root, ".memory/skills/tool/nested/.git/config", "nested");
  const before = snapshot(root),
    m = await load();
  assert.throws(() => m.migrateMemory({ targetDir: root }), /nested-git/);
  assert.deepEqual(snapshot(root), before);
});
test("missing official private index is synthesized from actual local records", async (t) => {
  const root = fixture(t, ["user"]);
  fs.unlinkSync(join(root, ".memory/users/AGENTS.md"));
  put(
    root,
    ".memory/users/user_local.md",
    "---\nname: local\ndescription: actual\n---\nbody",
  );
  const m = await load(),
    result = m.migrateMemory({ targetDir: root });
  assert.equal(result.status, "migrated-incomplete");
  assert.match(
    fs.readFileSync(join(root, ".harness/memory/users/AGENTS.md"), "utf8"),
    /\[local\]\(user_local.md\) — actual/,
  );
  assert.equal(result.diagnostics[0].code, "legacy-index-missing");
});
test("identical flat index coalesces but divergent prose is a conflict", async (t) => {
  const root = fixture(t, ["project"]);
  put(
    root,
    ".memory/PROJECT.md",
    fs.readFileSync(join(root, ".memory/projects/AGENTS.md")),
  );
  const m = await load();
  m.migrateMemory({ targetDir: root });
  assert.equal(fs.existsSync(join(root, ".memory")), false);
  const other = fixture(t, ["project"]);
  put(other, ".memory/PROJECT.md", "different\n" + entries);
  const before = snapshot(other);
  assert.throws(
    () => m.migrateMemory({ targetDir: other }),
    /legacy-index-conflict/,
  );
  assert.deepEqual(snapshot(other), before);
});
test("changed source directory permission is rejected on resume", async (t) => {
  const root = fixture(t, ["user"]),
    m = await load(),
    job = {
      ...m.planMigration(root, false),
      target: root,
      recursive: false,
      phase: "planned",
    };
  put(root, ".project-memory-migration/journal.json", JSON.stringify(job));
  fs.chmodSync(join(root, ".memory/users"), 0o700);
  const before = snapshot(root);
  assert.throws(
    () => m.migrateMemory({ targetDir: root }),
    /resume-source-directory-mode-changed/,
  );
  assert.deepEqual(snapshot(root), before);
});
test("copied journal rejects target permission changes and retains all sources", async (t) => {
  const root = fixture(t, ["user"]),
    m = await load(),
    job = {
      ...m.planMigration(root, false),
      target: root,
      recursive: false,
      phase: "copied",
    };
  for (const d of job.directoryMap) {
    fs.mkdirSync(d.target, { recursive: true });
    fs.chmodSync(d.target, d.targetMode);
  }
  for (const op of job.operations) m.writeState(op.target, op.after);
  put(root, ".project-memory-migration/journal.json", JSON.stringify(job));
  fs.chmodSync(join(root, ".harness/memory/users"), 0o700);
  const before = snapshot(root);
  assert.throws(
    () => m.migrateMemory({ targetDir: root }),
    /resume-target-directory-mode-changed/,
  );
  assert.deepEqual(snapshot(root), before);
});
test("copied journal validates external source hashes before retiring anything", async (t) => {
  const root = fixture(t, ["agent_skills", "project"]);
  put(
    root,
    ".agents/skills/tool/SKILL.md",
    "---\nname: tool\ndescription: old\n---\nbody",
  );
  put(root, ".memory/projects/project_x.md", "old");
  const m = await load(),
    job = {
      ...m.planMigration(root, false),
      target: root,
      recursive: false,
      phase: "copied",
    };
  for (const d of job.directoryMap) {
    fs.mkdirSync(d.target, { recursive: true });
    fs.chmodSync(d.target, d.targetMode);
  }
  for (const op of job.operations) m.writeState(op.target, op.after);
  put(root, ".project-memory-migration/journal.json", JSON.stringify(job));
  put(root, ".agents/skills/tool/SKILL.md", "new external body");
  assert.throws(
    () => m.migrateMemory({ targetDir: root }),
    /referenced-source-changed/,
  );
  assert.equal(
    fs.readFileSync(join(root, ".memory/projects/project_x.md"), "utf8"),
    "old",
  );
});
test("pending journal can resume partially retired sources and accepts reordered JSON keys", async (t) => {
  const root = fixture(t, ["project"]),
    m = await load();
  put(root, ".memory/projects/project_x.md", "body");
  const job = {
    ...m.planMigration(root, false),
    target: root,
    recursive: false,
    phase: "validated",
  };
  for (const d of job.directoryMap) {
    fs.mkdirSync(d.target, { recursive: true });
    fs.chmodSync(d.target, d.targetMode);
  }
  for (const op of job.operations) {
    m.writeState(op.target, op.after);
    op.after = {
      mode: op.after.mode,
      data: op.after.data,
      kind: op.after.kind,
    };
  }
  fs.unlinkSync(join(root, ".memory/projects/project_x.md"));
  put(root, ".project-memory-migration/journal.json", JSON.stringify(job));
  assert.equal(m.migrateMemory({ targetDir: root }).status, "migrated");
  assert.equal(fs.existsSync(join(root, ".memory")), false);
});

test("interruption before first private copy proves ignores and permissions precede bytes", async (t) => {
  const root = fixture(t, ["user"]);
  fs.mkdirSync(join(root, ".harness/memory/users"), {
    recursive: true,
    mode: 0o755,
  });
  fs.chmodSync(join(root, ".harness/memory/users"), 0o755);
  const agents = join(root, "AGENTS.md");
  fs.writeFileSync(
    agents,
    fs
      .readFileSync(agents, "utf8")
      .replace(".memory/users/AGENTS.md", ".harness/memory/users/AGENTS.md"),
  );
  put(root, ".memory/users/user_x.md", "private");
  fs.chmodSync(join(root, ".memory"), 0o700);
  const moduleUrl = new URL(
    "../../src/services/memory/migrate.ts",
    import.meta.url,
  ).href;
  const script = `import fs from 'node:fs'; import {syncBuiltinESMExports} from 'node:module'; import {execFileSync} from 'node:child_process'; import {dirname} from 'node:path'; const root=${JSON.stringify(root)}; const rename=fs.renameSync; fs.renameSync=(source,target)=>{if(String(target).includes('/.harness/memory/users/')){if((fs.statSync(dirname(target)).mode&0o777)!==0o700)throw Error('privacy-mode-not-ready');execFileSync('git',['-C',root,'check-ignore','-q','--no-index',String(target)]);throw Error('injected-before-private-copy');}return rename(source,target);};syncBuiltinESMExports(); const m=await import(${JSON.stringify(moduleUrl)});try{m.migrateMemory({targetDir:root});}catch(e){console.error(e.message);process.exitCode=71;}`;
  let error: any;
  try {
    execFileSync(
      process.execPath,
      ["--import", "tsx", "--input-type=module", "-e", script],
      { encoding: "utf8", stdio: "pipe" },
    );
  } catch (e) {
    error = e;
  }
  assert.equal(error.status, 71);
  assert.match(error.stderr, /injected-before-private-copy/);
  assert.equal(fs.existsSync(join(root, ".memory/users/user_x.md")), true);
  const m = await load();
  assert.equal(m.migrateMemory({ targetDir: root }).status, "migrated");
  assert.equal(
    fs.readFileSync(join(root, ".harness/memory/users/user_x.md"), "utf8"),
    "private",
  );
});

test("custom type identity cannot occupy an official destination", async (t) => {
  const root = fixture(t, ["project"]);
  put(
    root,
    ".memory/projects/AGENTS.md",
    "<!-- project-memory-type:start -->\nname: docs\nwritable: false\ngitignore: true\nformat: ordinary\n<!-- project-memory-type:end -->\n" +
      entries,
  );
  const before = snapshot(root),
    m = await load();
  assert.throws(
    () => m.migrateMemory({ targetDir: root }),
    /Official type path conflict/,
  );
  assert.deepEqual(snapshot(root), before);
});
for (const [module, format, expected] of [
  [undefined, "skills", "memory"],
  ["memory", "skills", "memory"],
  ["skills", "ordinary", "skills"],
])
  test(`custom ${format} format retains ${module ?? "default"} module and directory identity`, async (t) => {
    const root = fixture(t, ["docs"]);
    put(
      root,
      ".memory/docs/AGENTS.md",
      `<!-- project-memory-type:start -->\nname: guide\nwritable: false\nindex-only: true\ngitignore: true\nformat: ${format}\n${module ? "module: " + module + "\n" : ""}unknown: keep\n<!-- project-memory-type:end -->\nmanual intro\n${entries}`,
    );
    const rel = format === "skills" ? "method/SKILL.md" : "guide_example.md",
      body = "---\nname: method\ndescription: example\n---\nbody  \n";
    put(root, ".memory/docs/" + rel, body);
    const m = await load();
    m.migrateMemory({ targetDir: root });
    assert.equal(
      fs.readFileSync(join(root, `.harness/${expected}/docs/${rel}`), "utf8"),
      body,
    );
    const text = fs.readFileSync(
      join(root, `.harness/${expected}/docs/AGENTS.md`),
      "utf8",
    );
    assert.match(text, /name: guide/);
    assert.match(text, /unknown: keep/);
    assert.match(text, /index-only: true/);
    assert.ok(text.includes(`](${rel})`));
  });
test("unreadable referenced UTF-8 retains authored entries instead of treating source as empty", async (t) => {
  const root = fixture(t, ["agent_skills"]);
  put(
    root,
    ".memory/agent_skills/AGENTS.md",
    entries.replace(
      "- 暂无条目。",
      "- [keep](../../.agents/skills/x/SKILL.md) — manual",
    ),
  );
  put(root, ".agents/skills/x/SKILL.md", Buffer.from([255]));
  const m = await load(),
    result = m.migrateMemory({ targetDir: root });
  assert.equal(result.complete, false);
  assert.match(
    fs.readFileSync(join(root, ".harness/skills/referenced/AGENTS.md"), "utf8"),
    /\[keep\]/,
  );
});
test("owned skill content cannot follow a symlink outside its storage", async (t) => {
  const root = fixture(t, ["skills"]);
  put(root, "outside.md", "external");
  fs.mkdirSync(join(root, ".memory/skills/tool"), { recursive: true });
  fs.symlinkSync(
    "../../../outside.md",
    join(root, ".memory/skills/tool/SKILL.md"),
  );
  const before = snapshot(root),
    m = await load();
  assert.throws(
    () => m.migrateMemory({ targetDir: root }),
    /owned-body-symlink-escape/,
  );
  assert.deepEqual(snapshot(root), before);
});
test("existing public private-type directory is tightened before first copy", async (t) => {
  const root = fixture(t, ["user"]);
  put(root, ".memory/users/user_x.md", "private");
  put(root, ".memory/users/assets/data", "asset");
  fs.chmodSync(join(root, ".memory"), 0o700);
  fs.mkdirSync(join(root, ".harness/memory/users/assets"), {
    recursive: true,
    mode: 0o755,
  });
  fs.chmodSync(join(root, ".harness/memory/users"), 0o755);
  const agents = join(root, "AGENTS.md");
  fs.writeFileSync(
    agents,
    fs
      .readFileSync(agents, "utf8")
      .replace(".memory/users/AGENTS.md", ".harness/memory/users/AGENTS.md"),
  );
  const m = await load();
  m.migrateMemory({ targetDir: root });
  assert.equal(
    fs.statSync(join(root, ".harness/memory/users")).mode & 0o777,
    0o700,
  );
  assert.equal(
    fs.statSync(join(root, ".harness/memory/users/assets")).mode & 0o777,
    0o700,
  );
  assert.equal(
    fs.readFileSync(join(root, ".harness/memory/users/user_x.md"), "utf8"),
    "private",
  );
});

test("journal cannot retire a directory outside the selected scope", async (t) => {
  const root = fixture(t, ["project"]),
    m = await load(),
    job = {
      ...m.planMigration(root, false),
      target: root,
      recursive: false,
      phase: "planned",
    };
  job.directories.push(join(root, "..", "not-owned"));
  put(root, ".project-memory-migration/journal.json", JSON.stringify(job));
  const before = snapshot(root);
  assert.throws(
    () => m.migrateMemory({ targetDir: root, dryRun: true }),
    /outside-selected-scope/,
  );
  assert.deepEqual(snapshot(root), before);
});

test("copied journal never retires sources edited after copy", async (t) => {
  const root = fixture(t, ["project"]),
    m = await load();
  put(root, ".memory/projects/project_x.md", "before");
  const job = {
    ...m.planMigration(root, false),
    target: root,
    recursive: false,
    phase: "copied",
  };
  for (const d of job.directoryMap) {
    fs.mkdirSync(d.target, { recursive: true });
    fs.chmodSync(d.target, d.targetMode);
  }
  for (const op of job.operations) m.writeState(op.target, op.after);
  put(root, ".project-memory-migration/journal.json", JSON.stringify(job));
  put(root, ".memory/projects/project_x.md", "newer edit");
  const before = snapshot(root);
  assert.throws(
    () => m.migrateMemory({ targetDir: root }),
    /resume-source-edited/,
  );
  assert.deepEqual(snapshot(root), before);
});

test("generic checks every private target before resumed writes", async (t) => {
  const root = fixture(t, ["user"]),
    m = await load();
  m.migrateMemory({ targetDir: root });
  put(root, ".memory/users/user_new.md", "new private bytes");
  put(
    root,
    ".project-memory-migration/journal.json",
    JSON.stringify({
      ...m.planMigration(root, false),
      target: root,
      recursive: false,
      phase: "planned",
    }),
  );
  put(
    root,
    ".harness/.gitignore",
    "!memory/users/\n!memory/users/**\nmemory/users/AGENTS.md\n",
  );
  const journal = join(root, ".project-memory-migration/journal.json"),
    before = fs.readFileSync(journal);
  assert.throws(
    () => m.migrateMemory({ targetDir: root }),
    /ignore-coverage-failed/,
  );
  assert.equal(
    fs.existsSync(join(root, ".harness/memory/users/user_new.md")),
    false,
  );
  assert.deepEqual(fs.readFileSync(journal), before);
  assert.equal(
    fs.readFileSync(join(root, ".memory/users/user_new.md"), "utf8"),
    "new private bytes",
  );
});

for (const failure of ['missing-binary', 'broken-repository'] as const)
  test(`migration refuses ${failure} before private journal or copies despite an ineffective existing rule`, async t => {
    const root = fixture(t, ['user']), m = await load();
    const source = '---\nname: user_probe\ndescription: synthetic\n---\nsynthetic secret\n';
    put(root, '.memory/users/user_probe.md', source);
    put(root, '.gitignore', '/.project-memory-migration/\n!/.project-memory-migration/\n');
    const oldPath = process.env.PATH;
    if (failure === 'missing-binary') process.env.PATH = join(root, 'missing-bin');
    else {
      fs.rmSync(join(root, '.git'), { recursive: true });
      fs.symlinkSync('missing-repository', join(root, '.git'));
    }
    try {
      assert.throws(() => m.migrateMemory({ targetDir: root }), /private-ignore-check-failed/);
    } finally {
      if (oldPath === undefined) delete process.env.PATH;
      else process.env.PATH = oldPath;
    }
    assert.equal(fs.existsSync(join(root, '.project-memory-migration')), false);
    assert.equal(fs.existsSync(join(root, '.harness')), false);
    assert.equal(fs.readFileSync(join(root, '.memory/users/user_probe.md'), 'utf8'), source);
  });

test('migration supports a confirmed non-Git scope even without Git installed', async t => {
  const root = fixture(t, ['user']), m = await load();
  fs.rmSync(join(root, '.git'), { recursive: true });
  put(root, '.memory/users/user_probe.md', '---\nname: user_probe\ndescription: synthetic\n---\nbody\n');
  const oldPath = process.env.PATH;
  process.env.PATH = join(root, 'missing-bin');
  try { assert.equal(m.migrateMemory({ targetDir: root }).status, 'migrated'); }
  finally {
    if (oldPath === undefined) delete process.env.PATH;
    else process.env.PATH = oldPath;
  }
  assert.ok(fs.existsSync(join(root, '.harness/memory/users/user_probe.md')));
});

test('migration renders multiline display fields and special filenames as one safe entry without changing source bytes', async t => {
  const root = fixture(t, ['user']), m = await load();
  const filename = 'user_tricky ) [name] #?.md';
  const source = '---\nname: user_probe\ntitle: "A [test] title"\ndescription: "line one\\n- [forged](evil.md) — line two"\n---\nbody\n';
  put(root, `.memory/users/${filename}`, source);
  assert.equal(m.migrateMemory({ targetDir: root }).status, 'migrated');
  const index = fs.readFileSync(join(root, '.harness/memory/users/AGENTS.md'), 'utf8');
  const text = index.split('<!-- project-memory-entries:start -->')[1]!.split('<!-- project-memory-entries:end -->')[0]!.trim();
  assert.equal(text.split('\n').length, 1);
  const { fromMarkdown } = await import('mdast-util-from-markdown');
  const nodes: import('mdast').Nodes[] = [];
  const visit = (node: import('mdast').Nodes) => {
    nodes.push(node);
    if ('children' in node) node.children.forEach(visit);
  };
  visit(fromMarkdown(text));
  assert.equal(nodes.filter(n => n.type === 'listItem').length, 1);
  const links = nodes.filter(n => n.type === 'link');
  assert.equal(links.length, 1);
  assert.equal(links[0]!.url, 'user_tricky%20%29%20%5Bname%5D%20%23%3F.md');
  assert.equal(links[0]!.children.map(n => 'value' in n ? n.value : '').join(''), 'A [test] title');
  assert.ok(nodes.some(n => n.type === 'text' && n.value.includes('line one - [forged](evil.md) — line two')));
  assert.equal(fs.readFileSync(join(root, `.harness/memory/users/${filename}`), 'utf8'), source);
});

test('migration discards stale derived links with raw percent signs before rewriting source links', async t => {
  const root = fixture(t, ['project']), m = await load();
  const source = '---\nname: project_current\ndescription: Current entry\n---\nCurrent body\n';
  put(root, '.memory/projects/project_current.md', source);
  put(root, '.memory/projects/AGENTS.md', '# Projects\nmanual intro\n<!-- project-memory-entries:start -->\n- [Old](project_100%.md) — deleted entry\n<!-- project-memory-entries:end -->\n');
  const before = snapshot(root);
  assert.equal(m.migrateMemory({ targetDir: root, dryRun: true }).status, 'dry-run');
  assert.deepEqual(snapshot(root), before);
  assert.equal(m.migrateMemory({ targetDir: root }).status, 'migrated');
  const index = fs.readFileSync(join(root, '.harness/memory/projects/AGENTS.md'), 'utf8');
  assert.ok(index.includes('- [project\\_current](project_current.md) — Current entry'));
  assert.doesNotMatch(index, /project_100%|deleted entry/);
  assert.equal(fs.readFileSync(join(root, '.harness/memory/projects/project_current.md'), 'utf8'), source);
});
