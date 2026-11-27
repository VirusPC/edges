import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm, stat } from "node:fs/promises";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { run } from "../../src/program.js";
import "../register-skills-install-mock.js";
import { initMemory } from "../../src/services/memory/init.js";
import { acquireWriteLock } from "../../src/services/node/node-lock.js";

const commandsRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../src/commands",
);

async function scope(t: test.TestContext) {
  const root = await mkdtemp(path.join(tmpdir(), "edges-init-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

async function tree(root: string): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  async function walk(dir: string) {
    for (const name of await readdir(dir)) {
      const abs = path.join(dir, name);
      const rel = path.relative(root, abs).split(path.sep).join("/");
      const info = await stat(abs);
      if (info.isDirectory()) await walk(abs);
      else out.set(rel, await readFile(abs, "utf8"));
    }
  }
  await walk(root);
  return out;
}

test("edges init --help lists tasks with modules this command creates and keeps routines out", async () => {
  const help = await run(["init", "--help"], { env: {} });
  assert.equal(help.exitCode, 0, help.stdout + help.stderr);
  assert.match(help.stdout, /--super uses <scope>\/<module>\//);
  assert.doesNotMatch(help.stdout, /does not read --super/);
  const createdAt = help.stdout.indexOf("CREATED WHEN NO MODULE IS GIVEN");
  const notCreatedAt = help.stdout.indexOf("NOT CREATED HERE");
  assert.ok(createdAt >= 0 && notCreatedAt > createdAt, help.stdout);
  const created = help.stdout.slice(createdAt, notCreatedAt);
  const rest = help.stdout.slice(notCreatedAt);
  assert.match(created, /feedback, project, reference/);
  assert.match(created, /\bskills\b/);
  assert.match(created, /\bnotes\b/);
  assert.match(created, /\bprojects\b/);
  assert.match(created, /\btasks\b/);
  assert.match(created, /\.edges\/tasks/);
  assert.match(created, /\broutines\b/);
  assert.doesNotMatch(rest, /\btasks\b/);
  assert.doesNotMatch(rest, /not in the default set/);
  assert.doesNotMatch(rest, /adopts skill types/);
});

test("edges skills init --help recommends a project install and keeps -g explicit", async () => {
  const help = await run(["skills", "init", "--help"], { env: {} });
  assert.equal(help.exitCode, 0, help.stdout + help.stderr);
  const forwarded = [...help.stdout.matchAll(/^  edges skills init -- .+$/gm)].map((match) => match[0].trim());
  assert.equal(forwarded[0], "edges skills init -- -y");
  assert.equal(forwarded.includes("edges skills init -- -g -y"), true);
});

test("edges init on an empty scope writes AGENTS, public memory types, and harness boards", async (t) => {
  const root = await scope(t);
  const result = await run(["--scope", root, "init"], { env: {} });
  assert.equal(result.exitCode, 0, result.stdout + result.stderr);
  const body = JSON.parse(result.stdout) as { status: string; command: string; modules: string[] };
  assert.equal(body.status, "success");
  assert.equal(body.command, "init");
  assert.deepEqual(body.modules, ["memory", "notes", "skills", "tasks", "routines", "projects"]);
  for (const rel of [
    "AGENTS.md",
    ".edges/tasks/README.md",
    ".edges/notes/README.md",
    ".edges/projects/README.md",
    ".edges/memory/feedbacks/README.md",
    ".edges/memory/projects/README.md",
    ".edges/memory/references/README.md",
    ".edges/skills/managed/README.md",
    ".edges/skills/referenced/README.md",
  ]) {
    assert.equal(existsSync(path.join(root, rel)), true, rel);
  }
  for (const module of ["tasks", "notes", "projects", "routines"]) {
    assert.equal(existsSync(path.join(root, module, "README.md")), false, module);
    const index = await readFile(path.join(root, ".edges", module, "README.md"), "utf8");
    assert.match(index, /edges-entries-local:start/, module);
  }
  for (const rel of [
    ".edges/memory/users/README.md",
    ".edges/evaluation/README.md",
    ".edges/observation/README.md",
  ]) {
    assert.equal(existsSync(path.join(root, rel)), false, rel);
  }
  const agents = await readFile(path.join(root, "AGENTS.md"), "utf8");
  assert.match(agents, /\.edges\/README\.md/);
  assert.doesNotMatch(agents, /\.edges\/tasks\/README\.md/);
  assert.doesNotMatch(agents, /\.edges\/notes\/README\.md/);
  assert.doesNotMatch(agents, /\.edges\/projects\/README\.md/);
  assert.doesNotMatch(agents, /\.edges\/memory\/feedbacks\/README\.md/);
  const index = await readFile(path.join(root, ".edges/README.md"), "utf8");
  assert.match(index, /tasks\/README\.md/);
  assert.match(index, /notes\/README\.md/);
  assert.match(index, /projects\/README\.md/);
  assert.match(index, /routines\/README\.md/);
  assert.match(index, /memory\/feedbacks\/README\.md/);
  assert.doesNotMatch(index, /^---/m);
  assert.equal(agents.split("材料放在本层").length - 1, 1);
  for (const point of ["只改文案时不查", "话题可能已经有笔记时先查", "动手前先查本层的 managed 技能", "提到待办、进度、下一步", "提到定时、周期或例行工作", "给任务、笔记选主题前先查"]) {
    assert.match(agents, new RegExp(point));
  }
});

test("edges init notes and edges notes init write the same files", async (t) => {
  const left = await scope(t);
  const right = await scope(t);
  const fromRoot = await run(["--scope", left, "init", "notes"], { env: {} });
  const fromDomain = await run(["--scope", right, "notes", "init"], { env: {} });
  assert.equal(fromRoot.exitCode, 0, fromRoot.stdout + fromRoot.stderr);
  assert.equal(fromDomain.exitCode, 0, fromDomain.stdout + fromDomain.stderr);
  const normalize = async (root: string) => {
    const name = path.basename(root);
    const files = await tree(root);
    return new Map([...files].map(([rel, text]) => [rel, text.replaceAll(name, "<scope>")]));
  };
  assert.deepEqual(await normalize(left), await normalize(right));
  const rootBody = JSON.parse(fromRoot.stdout) as { modules: string[]; command: string };
  const domainBody = JSON.parse(fromDomain.stdout) as { modules: string[]; command: string };
  assert.deepEqual(rootBody.modules, ["notes"]);
  assert.deepEqual(domainBody.modules, ["notes"]);
  assert.equal(rootBody.command, "init");
  assert.equal(domainBody.command, "notes.init");
  assert.equal(existsSync(path.join(left, ".edges/projects/README.md")), false);
  assert.equal(existsSync(path.join(left, "notes/README.md")), false);
  assert.match(await readFile(path.join(left, ".edges/notes/README.md"), "utf8"), /edges-entries-local:start/);
  const notesAgents = await readFile(path.join(left, "AGENTS.md"), "utf8");
  assert.match(notesAgents, /\.edges\/README\.md/);
  assert.doesNotMatch(notesAgents, /\.edges\/notes\/README\.md/);
  assert.match(await readFile(path.join(left, ".edges/README.md"), "utf8"), /notes\/README\.md/);
});

test("edges init memory does not create notes or projects boards", async (t) => {
  const root = await scope(t);
  const result = await run(["--scope", root, "init", "memory"], { env: {} });
  assert.equal(result.exitCode, 0, result.stdout + result.stderr);
  assert.equal(existsSync(path.join(root, ".edges/memory/feedbacks/README.md")), true);
  assert.equal(existsSync(path.join(root, ".edges/notes/README.md")), false);
  assert.equal(existsSync(path.join(root, ".edges/projects/README.md")), false);
});

test("edges init is idempotent and keeps an existing harness board", async (t) => {
  const root = await scope(t);
  const first = await run(["--scope", root, "init"], { env: {} });
  assert.equal(first.exitCode, 0, first.stdout);
  const notes = path.join(root, ".edges/notes/README.md");
  const custom = `${await readFile(notes, "utf8")}\n手写说明保留。\n`;
  const { writeFile } = await import("node:fs/promises");
  await writeFile(notes, custom);
  const before = await readFile(path.join(root, "AGENTS.md"), "utf8");
  const second = await run(["--scope", root, "init"], { env: {} });
  assert.equal(second.exitCode, 0, second.stdout + second.stderr);
  assert.equal(await readFile(path.join(root, "AGENTS.md"), "utf8"), before);
  assert.equal(await readFile(notes, "utf8"), custom);
});

test("edges init without --super stays on .edges and does not add the independent-harness line", async (t) => {
  const root = await scope(t);
  const result = await run(["--scope", root, "init", "notes"], { env: {} });
  assert.equal(result.exitCode, 0, result.stdout + result.stderr);
  assert.equal(existsSync(path.join(root, ".edges/notes/README.md")), true);
  assert.equal(existsSync(path.join(root, "notes/README.md")), false);
  assert.doesNotMatch(await readFile(path.join(root, "AGENTS.md"), "utf8"), /这是独立 edges harness 仓库/);
});

test("single module init writes only that module and its constraint point", async (t) => {
  const root = await scope(t);
  const result = await run(["--scope", root, "init", "notes"], { env: {} });
  assert.equal(result.exitCode, 0, result.stdout + result.stderr);
  assert.equal(existsSync(path.join(root, ".edges/notes/README.md")), true);
  assert.equal(existsSync(path.join(root, ".edges/routines/README.md")), false);
  assert.equal(existsSync(path.join(root, ".edges/memory/feedbacks/README.md")), false);
  const agents = await readFile(path.join(root, "AGENTS.md"), "utf8");
  assert.match(agents, /话题可能已经有笔记时先查/);
  assert.doesNotMatch(agents, /只改文案时不查/);
  assert.doesNotMatch(agents, /提到定时、周期或例行工作/);
  assert.equal(agents.split("材料放在本层").length - 1, 1);
});

test("re-running init on an older default set adds routines without rewriting the preamble", async (t) => {
  const root = await scope(t);
  const first = await run(["--scope", root, "init", "memory", "notes", "skills", "tasks", "projects"], { env: {} });
  assert.equal(first.exitCode, 0, first.stdout + first.stderr);
  assert.equal(existsSync(path.join(root, ".edges/routines/README.md")), false);
  const agentsPath = path.join(root, "AGENTS.md");
  const before = await readFile(agentsPath, "utf8");
  const edited = before.replace("材料放在本层", "材料放在用户改过的本层");
  const { writeFile } = await import("node:fs/promises");
  await writeFile(agentsPath, edited);
  const second = await run(["--scope", root, "init"], { env: {} });
  assert.equal(second.exitCode, 0, second.stdout + second.stderr);
  assert.equal(existsSync(path.join(root, ".edges/routines/README.md")), true);
  const after = await readFile(agentsPath, "utf8");
  assert.match(after, /材料放在用户改过的本层/);
  assert.equal(after.split("材料放在").length - 1, 1);
  assert.match(after, /提到定时、周期或例行工作/);
  assert.match(after, /话题可能已经有笔记时先查/);
});

test("a user-edited type point is kept and an old official sentence is refreshed", async (t) => {
  const root = await scope(t);
  const first = await run(["--scope", root, "init", "notes"], { env: {} });
  assert.equal(first.exitCode, 0, first.stdout + first.stderr);
  const agentsPath = path.join(root, "AGENTS.md");
  const { writeFile } = await import("node:fs/promises");
  const edited = (await readFile(agentsPath, "utf8")).replace("不新开", "不新开，这是用户改过的句子");
  const withOld = `${edited.replace(
    "<!-- edges-constraints:end -->",
    "- 本目录有项目记忆。提问或动手前用 `$edges-memory-ask`；该沉淀用 `$edges-memory-remember`。本轮查过不重复。\n<!-- edges-constraints:end -->",
  )}`;
  await writeFile(agentsPath, withOld);
  const second = await run(["--scope", root, "init", "notes", "memory"], { env: {} });
  assert.equal(second.exitCode, 0, second.stdout + second.stderr);
  const after = await readFile(agentsPath, "utf8");
  assert.match(after, /不新开，这是用户改过的句子/);
  assert.doesNotMatch(after, /\$edges-memory-ask/);
  assert.match(after, /只改文案时不查/);
  assert.equal(after.split("材料放在本层").length - 1, 1);
  const notesAt = after.indexOf("不新开，这是用户改过的句子");
  const memoryAt = after.indexOf("只改文案时不查");
  assert.ok(memoryAt >= 0 && memoryAt < notesAt, after);
});

test("commands do not import the harness material catalog", () => {
  function walk(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) return walk(abs);
      return entry.name.endsWith(".ts") ? [abs] : [];
    });
  }
  const files = walk(commandsRoot);
  assert.ok(files.length > 0);
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    assert.doesNotMatch(
      text,
      /domain\/config\/edges-materials/,
      path.relative(commandsRoot, file),
    );
  }
});

test("init commands do not import the material catalog or write files themselves", () => {
  const files = [
    "init.ts",
    "notes/init.ts",
    "projects/init.ts",
    "memory/init.ts",
    "skills/init.ts",
    "tasks/init.ts",
  ].map((rel) => path.join(commandsRoot, rel));
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    assert.doesNotMatch(text, /edges-materials/);
    assert.doesNotMatch(text, /writeFileSync|readFileSync|mkdirSync/);
    assert.match(text, /services\/(init|notes|projects|memory|skills|tasks)\/service\.js/);
  }
});

test("new init commands take the scope write lock", async (t) => {
  const root = await scope(t);
  const release = await acquireWriteLock(root);
  t.after(() => release());
  for (const args of [
    ["--scope", root, "init"],
    ["--scope", root, "notes", "init"],
    ["--scope", root, "projects", "init"],
    ["--scope", root, "skills", "init"],
    ["--scope", root, "tasks", "init"],
  ]) {
    const blocked = await run(args, { env: {} });
    assert.notEqual(blocked.exitCode, 0, args.join(" "));
    assert.match(blocked.stdout, /write lock.*busy/i, blocked.stdout);
  }
});

test("type flags without the memory module are rejected", async (t) => {
  const root = await scope(t);
  const result = await run(["--scope", root, "init", "notes", "--memory-types", "project"], { env: {} });
  assert.notEqual(result.exitCode, 0);
  assert.match(result.stdout, /require the memory module/);
  assert.equal(existsSync(path.join(root, "AGENTS.md")), false);
});

test("memory init does not create or register notes or projects", async (t) => {
  const root = await scope(t);
  const result = await run(["--scope", root, "memory", "init", "--memory-types", "project"], { env: {} });
  assert.equal(result.exitCode, 0, result.stdout + result.stderr);
  assert.equal(existsSync(path.join(root, ".edges/memory/projects/README.md")), true);
  for (const rel of [
    ".edges/notes/README.md",
    ".edges/projects/README.md",
    ".edges/tasks/README.md",
    ".edges/skills/managed/README.md",
  ]) {
    assert.equal(existsSync(path.join(root, rel)), false, rel);
  }
  const agents = await readFile(path.join(root, "AGENTS.md"), "utf8");
  assert.match(agents, /\.edges\/README\.md/);
  assert.doesNotMatch(agents, /\.edges\/memory\/projects\/README\.md/);
  assert.doesNotMatch(agents, /\.edges\/notes\/README\.md/);
  assert.doesNotMatch(agents, /\.edges\/projects\/README\.md/);
  assert.match(await readFile(path.join(root, ".edges/README.md"), "utf8"), /memory\/projects\/README\.md/);
});

test("memory init rejects skill type flags and writes nothing", async (t) => {
  const root = await scope(t);
  await assert.rejects(
    () => initMemory({ targetDir: root, skillTypes: ["managed"] }),
    /require the skills module/,
  );
  const cli = await run(["--scope", root, "memory", "init", "--skill-types", "managed"], { env: {} });
  assert.notEqual(cli.exitCode, 0);
  assert.match(cli.stdout, /skill-types|unknown option/i);
  assert.equal(existsSync(path.join(root, "AGENTS.md")), false);
  assert.equal(existsSync(path.join(root, ".edges")), false);
});

test("skill type flags without the skills module are rejected", async (t) => {
  const root = await scope(t);
  const result = await run(["--scope", root, "init", "notes", "--skill-types", "managed"], { env: {} });
  assert.notEqual(result.exitCode, 0);
  assert.match(result.stdout, /require the skills module/);
  assert.equal(existsSync(path.join(root, "AGENTS.md")), false);
});

test("edges init skills and edges skills init write the same files", async (t) => {
  const left = await scope(t);
  const right = await scope(t);
  const fromRoot = await run(["--scope", left, "init", "skills"], { env: {} });
  const fromDomain = await run(["--scope", right, "skills", "init"], { env: {} });
  assert.equal(fromRoot.exitCode, 0, fromRoot.stdout + fromRoot.stderr);
  assert.equal(fromDomain.exitCode, 0, fromDomain.stdout + fromDomain.stderr);
  const normalize = async (dir: string) => {
    const name = path.basename(dir);
    const files = await tree(dir);
    return new Map([...files].map(([rel, text]) => [rel, text.replaceAll(name, "<scope>")]));
  };
  assert.deepEqual(await normalize(left), await normalize(right));
  const rootBody = JSON.parse(fromRoot.stdout) as { modules: string[]; command: string };
  const domainBody = JSON.parse(fromDomain.stdout) as { modules: string[]; command: string };
  assert.deepEqual(rootBody.modules, ["skills"]);
  assert.deepEqual(domainBody.modules, ["skills"]);
  assert.equal(rootBody.command, "init");
  assert.equal(domainBody.command, "skills.init");
  for (const rel of [
    ".edges/skills/managed/README.md",
    ".edges/skills/referenced/README.md",
  ]) {
    assert.equal(existsSync(path.join(left, rel)), true, rel);
  }
  for (const rel of [
    ".edges/notes/README.md",
    ".edges/projects/README.md",
    ".edges/tasks/README.md",
    ".edges/memory/projects/README.md",
  ]) {
    assert.equal(existsSync(path.join(left, rel)), false, rel);
  }
});

test("edges init tasks and edges tasks init write only the tasks board", async (t) => {
  const left = await scope(t);
  const right = await scope(t);
  const fromRoot = await run(["--scope", left, "init", "tasks"], { env: {} });
  const fromDomain = await run(["--scope", right, "tasks", "init"], { env: {} });
  assert.equal(fromRoot.exitCode, 0, fromRoot.stdout + fromRoot.stderr);
  assert.equal(fromDomain.exitCode, 0, fromDomain.stdout + fromDomain.stderr);
  const normalize = async (dir: string) => {
    const name = path.basename(dir);
    const files = await tree(dir);
    return new Map([...files].map(([rel, text]) => [rel, text.replaceAll(name, "<scope>")]));
  };
  assert.deepEqual(await normalize(left), await normalize(right));
  const domainBody = JSON.parse(fromDomain.stdout) as { modules: string[]; command: string };
  assert.deepEqual(domainBody.modules, ["tasks"]);
  assert.equal(domainBody.command, "tasks.init");
  const board = await readFile(path.join(left, ".edges/tasks/README.md"), "utf8");
  assert.match(board, /edges-entries-local:start/);
  const agents = await readFile(path.join(left, "AGENTS.md"), "utf8");
  assert.match(agents, /\.edges\/README\.md/);
  assert.doesNotMatch(agents, /\.edges\/tasks\/README\.md/);
  assert.match(await readFile(path.join(left, ".edges/README.md"), "utf8"), /tasks\/README\.md/);
  for (const rel of [
    ".edges/notes/README.md",
    ".edges/projects/README.md",
    ".edges/skills/managed/README.md",
    ".edges/memory/feedbacks/README.md",
    "tasks/README.md",
  ]) {
    assert.equal(existsSync(path.join(left, rel)), false, rel);
  }
  const custom = `${board}\n手写看板保留。\n`;
  const { writeFile } = await import("node:fs/promises");
  await writeFile(path.join(left, ".edges/tasks/README.md"), custom);
  const again = await run(["--scope", left, "tasks", "init"], { env: {} });
  assert.equal(again.exitCode, 0, again.stdout + again.stderr);
  assert.equal(await readFile(path.join(left, ".edges/tasks/README.md"), "utf8"), custom);
});
