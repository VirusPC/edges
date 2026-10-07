import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm, stat } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { run } from "../../src/program.js";
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

test("edges init --help separates tasks from modules this command creates and ignores --super", async () => {
  const help = await run(["init", "--help"], { env: {} });
  assert.equal(help.exitCode, 0, help.stdout + help.stderr);
  assert.match(help.stdout, /does not read --super/);
  const createdAt = help.stdout.indexOf("CREATED WHEN NO MODULE IS GIVEN");
  const notCreatedAt = help.stdout.indexOf("NOT CREATED HERE");
  assert.ok(createdAt >= 0 && notCreatedAt > createdAt, help.stdout);
  const created = help.stdout.slice(createdAt, notCreatedAt);
  const rest = help.stdout.slice(notCreatedAt);
  assert.match(created, /feedback, project, reference/);
  assert.match(created, /\bnotes\b/);
  assert.match(created, /\bprojects\b/);
  assert.doesNotMatch(created, /\btasks\b/);
  assert.match(rest, /\btasks\b/);
});

test("edges init on an empty scope writes AGENTS, public memory types, and harness boards", async (t) => {
  const root = await scope(t);
  const result = await run(["--scope", root, "init"], { env: {} });
  assert.equal(result.exitCode, 0, result.stdout + result.stderr);
  const body = JSON.parse(result.stdout) as { status: string; command: string; modules: string[] };
  assert.equal(body.status, "success");
  assert.equal(body.command, "init");
  assert.deepEqual(body.modules, ["memory", "notes", "projects"]);
  for (const rel of [
    "AGENTS.md",
    ".harness/notes/README.md",
    ".harness/projects/README.md",
    ".harness/memory/feedbacks/README.md",
    ".harness/memory/projects/README.md",
    ".harness/memory/references/README.md",
  ]) {
    assert.equal(existsSync(path.join(root, rel)), true, rel);
  }
  for (const rel of [
    "notes/README.md",
    "projects/README.md",
    ".harness/memory/users/README.md",
    ".harness/skills/managed/README.md",
    ".harness/tasks/README.md",
    ".harness/evaluation/README.md",
    ".harness/observation/README.md",
  ]) {
    assert.equal(existsSync(path.join(root, rel)), false, rel);
  }
  const agents = await readFile(path.join(root, "AGENTS.md"), "utf8");
  assert.match(agents, /\.harness\/notes\/README\.md/);
  assert.match(agents, /\.harness\/projects\/README\.md/);
  assert.match(agents, /\.harness\/memory\/feedbacks\/README\.md/);
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
  assert.equal(existsSync(path.join(left, ".harness/projects/README.md")), false);
  assert.equal(existsSync(path.join(left, "notes/README.md")), false);
  assert.match(await readFile(path.join(left, "AGENTS.md"), "utf8"), /\.harness\/notes\/README\.md/);
});

test("edges init memory does not create notes or projects boards", async (t) => {
  const root = await scope(t);
  const result = await run(["--scope", root, "init", "memory"], { env: {} });
  assert.equal(result.exitCode, 0, result.stdout + result.stderr);
  assert.equal(existsSync(path.join(root, ".harness/memory/feedbacks/README.md")), true);
  assert.equal(existsSync(path.join(root, ".harness/notes/README.md")), false);
  assert.equal(existsSync(path.join(root, ".harness/projects/README.md")), false);
});

test("edges init is idempotent and keeps an existing harness board", async (t) => {
  const root = await scope(t);
  const first = await run(["--scope", root, "init"], { env: {} });
  assert.equal(first.exitCode, 0, first.stdout);
  const notes = path.join(root, ".harness/notes/README.md");
  const custom = `${await readFile(notes, "utf8")}\n手写说明保留。\n`;
  const { writeFile } = await import("node:fs/promises");
  await writeFile(notes, custom);
  const before = await readFile(path.join(root, "AGENTS.md"), "utf8");
  const second = await run(["--scope", root, "init"], { env: {} });
  assert.equal(second.exitCode, 0, second.stdout + second.stderr);
  assert.equal(await readFile(path.join(root, "AGENTS.md"), "utf8"), before);
  assert.equal(await readFile(notes, "utf8"), custom);
});

test("edges init does not read --super when choosing the write root", async (t) => {
  const root = await scope(t);
  const result = await run(["--scope", root, "--super", "init", "notes"], { env: {} });
  assert.equal(result.exitCode, 0, result.stdout + result.stderr);
  assert.equal(existsSync(path.join(root, ".harness/notes/README.md")), true);
  assert.equal(existsSync(path.join(root, "notes/README.md")), false);
});

test("init commands do not import the material catalog or write files themselves", () => {
  const files = [
    "init.ts",
    "notes/init.ts",
    "projects/init.ts",
    "memory/init.ts",
  ].map((rel) => path.join(commandsRoot, rel));
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    assert.doesNotMatch(text, /harness-materials/);
    assert.doesNotMatch(text, /writeFileSync|readFileSync|mkdirSync/);
    assert.match(text, /services\/(init|notes|projects|memory)\/service\.js/);
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
