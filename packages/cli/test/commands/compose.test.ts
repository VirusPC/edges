import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { run } from "../../src/program.js";
import { NodeService } from "../../src/services/node/node-service.js";
import { buildSystemForest } from "../../src/services/node/system-forest-service.js";

const agents = (body = "") => `# Scope

<!-- edges:start -->
<!-- edges-constraints:start -->
## 本层硬约束

- keep
<!-- edges-constraints:end -->
${body}<!-- edges:end -->
`;

function git(args: string[], cwd?: string): string {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: "Edges Test",
      GIT_AUTHOR_EMAIL: "edges@example.com",
      GIT_COMMITTER_NAME: "Edges Test",
      GIT_COMMITTER_EMAIL: "edges@example.com",
      GIT_TERMINAL_PROMPT: "0",
    },
  });
}

function commit(cwd: string, message: string, file: string, contents: string): void {
  writeFileSync(path.join(cwd, file), contents);
  git(["add", file], cwd);
  git(
    ["-c", "commit.gpgsign=false", "-c", "user.email=edges@example.com", "-c", "user.name=Edges Test", "commit", "-m", message],
    cwd,
  );
}

function failed(stdout: string): { status: string; errorCode: string; reason: string } {
  return JSON.parse(stdout) as { status: string; errorCode: string; reason: string };
}

test("compose add --help marks --description as required", async () => {
  const result = await run(["compose", "add", "--help"]);
  assert.equal(result.exitCode, 0);
  assert.match(result.stdout, /--description\s+<text>/);
  assert.match(result.stdout, /required/i);
});

test("compose add without --description is a validation error and leaves AGENTS.md unchanged", async (t) => {
  const root = mkdtempSync(path.join(tmpdir(), "compose-register-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const scope = path.join(root, "scope");
  mkdirSync(scope, { recursive: true });
  const file = path.join(scope, "AGENTS.md");
  const before = agents();
  writeFileSync(file, before);
  const env = { ...process.env, EDGES_SCOPE: scope };

  const missing = await run(
    ["compose", "add", "--name", "brain", "--remote", "https://github.com/example/brain.git"],
    { env },
  );
  assert.equal(missing.exitCode, 2);
  const missingBody = failed(missing.stdout);
  assert.equal(missingBody.status, "failed");
  assert.equal(missingBody.errorCode, "VALIDATION_ERROR");
  assert.match(missingBody.reason, /--description/);
  assert.match(missingBody.reason, /required/i);
  assert.equal(readFileSync(file, "utf8"), before);

  const empty = await run(
    ["compose", "add", "--name", "brain", "--remote", "https://github.com/example/brain.git", "--description", ""],
    { env },
  );
  assert.equal(empty.exitCode, 2);
  const emptyBody = failed(empty.stdout);
  assert.equal(emptyBody.errorCode, "VALIDATION_ERROR");
  assert.match(emptyBody.reason, /--description/);
  assert.match(emptyBody.reason, /required/i);
  assert.equal(readFileSync(file, "utf8"), before);

  const blank = await run(
    ["compose", "add", "--name", "brain", "--description", "   "],
    { env },
  );
  assert.equal(blank.exitCode, 2);
  assert.equal(failed(blank.stdout).errorCode, "VALIDATION_ERROR");
  assert.equal(readFileSync(file, "utf8"), before);
});

test("compose add writes the description into the Compose block", async (t) => {
  const root = mkdtempSync(path.join(tmpdir(), "compose-desc-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const scope = path.join(root, "scope");
  mkdirSync(scope, { recursive: true });
  const file = path.join(scope, "AGENTS.md");
  writeFileSync(file, agents());
  const env = { ...process.env, EDGES_SCOPE: scope };
  const registered = await run(
    [
      "compose",
      "add",
      "--name",
      "brain",
      "--remote",
      "https://github.com/example/brain.git",
      "--description",
      "个人大脑：只在记跨项目判断时写入",
    ],
    { env },
  );
  assert.equal(registered.exitCode, 0, registered.stdout + registered.stderr);
  const source = readFileSync(path.join(scope, ".edges", "compose", "README.md"), "utf8");
  assert.match(
    source,
    /\[brain\]\(<brain\/README\.md>\) — 个人大脑：只在记跨项目判断时写入 remote: https:\/\/github\.com\/example\/brain\.git/,
  );
  assert.doesNotMatch(readFileSync(file, "utf8"), /edges-compose/);
  assert.match(readFileSync(path.join(scope, ".edges", "README.md"), "utf8"), /compose\/README\.md/);
  const body = JSON.parse(registered.stdout) as { description?: string; href?: string; submodule?: string };
  assert.equal(body.description, "个人大脑：只在记跨项目判断时写入");
  assert.equal(body.href, "brain/README.md");
  assert.equal(body.submodule, undefined);
  // The scope is not a git repo: no submodule add, and a hint on stderr.
  assert.match(registered.stderr, /^warning: compose entry brain is outside the owner's git repo; skipped git submodule add/m);
});

test("edges compose daily commands are add, list, and update; doctor is migration-only", async () => {
  const result = await run(["compose", "--help"]);
  assert.equal(result.exitCode, 0);
  const commands = [...result.stdout.matchAll(/^  (\w+)\b/gm)].map((match) => match[1]);
  assert.deepEqual(commands.filter((name) => name !== "help").sort(), ["add", "doctor", "list", "update"]);
  assert.match(result.stdout, /no\nunregister \/ push \/ sync|no unregister/i);
  assert.match(result.stdout, /doctor is migration-only/);
  assert.match(result.stdout, /Daily edits stay on compose add, list, and update|add, list, update/);
  const doctor = await run(["compose", "doctor", "--help"]);
  assert.equal(doctor.exitCode, 0);
  assert.match(doctor.stdout, /migration-only|One-shot migration/);
  assert.match(doctor.stdout, /--apply/);
  for (const old of ["register", "unregister", "clone", "pull", "push"]) {
    const gone = await run(["compose", old, "--name", "x"]);
    assert.equal(gone.exitCode, 2, old);
    assert.equal(failed(gone.stdout).errorCode, "VALIDATION_ERROR");
  }
});

/** Lets git (and `edges compose`) use file:// / local-path submodule remotes in tests. */
const FILE_PROTOCOL = {
  GIT_CONFIG_COUNT: "1",
  GIT_CONFIG_KEY_0: "protocol.file.allow",
  GIT_CONFIG_VALUE_0: "always",
};

function gitSub(args: string[], cwd: string): string {
  return git(["-c", "protocol.file.allow=always", ...args], cwd);
}

function commitAll(cwd: string, message: string): void {
  git(["add", "-A"], cwd);
  git(
    ["-c", "commit.gpgsign=false", "-c", "user.email=edges@example.com", "-c", "user.name=Edges Test", "commit", "-q", "-m", message],
    cwd,
  );
}

function composeBlock(lines: string[]): string {
  return `<!-- edges-compose:start -->
## 组合

${lines.join("\n")}
<!-- edges-compose:end -->
`;
}

function composeReadme(lines: string[]): string {
  return `# 被组合的 harness 仓库

${composeBlock(lines)}`;
}

/** A bare remote plus a working source repo whose first commit is `files`. */
function setupRemote(root: string, name: string, files: Record<string, string> = { "README.md": `${name}\n` }): { bare: string; source: string } {
  const bare = path.join(root, `${name}.git`);
  const source = path.join(root, `${name}-source`);
  git(["init", "-q", "--bare", "-b", "main", bare]);
  git(["init", "-q", "-b", "main", source]);
  for (const [file, contents] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(source, file)), { recursive: true });
    writeFileSync(path.join(source, file), contents);
  }
  commitAll(source, "init");
  git(["remote", "add", "origin", bare], source);
  git(["push", "-q", "-u", "origin", "main"], source);
  return { bare, source };
}

/** Owner repo: a git work tree whose root AGENTS.md is the Compose scope. */
function setupOwner(root: string, name = "owner"): string {
  const owner = path.join(root, name);
  git(["init", "-q", "-b", "main", owner]);
  writeFileSync(path.join(owner, "AGENTS.md"), agents());
  commitAll(owner, "init");
  return owner;
}

interface GitEntries {
  status: string;
  errorCode?: string;
  reason?: string;
  entries: Array<{ name: string; action: string; error?: string; directory?: string }>;
}

test("compose add --remote adds a git submodule at .edges/compose/<name> with a relative href", async (t) => {
  const root = mkdtempSync(path.join(tmpdir(), "compose-sub-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { bare, source } = setupRemote(root, "brain");
  const owner = setupOwner(root);
  const env = { ...process.env, ...FILE_PROTOCOL, EDGES_SCOPE: owner };
  const checkout = path.join(owner, ".edges", "compose", "brain");

  const registered = await run(
    ["compose", "add", "--name", "brain", "--remote", bare, "--description", "个人大脑"],
    { env },
  );
  assert.equal(registered.exitCode, 0, registered.stdout + registered.stderr);
  const body = JSON.parse(registered.stdout) as { submodule?: string; href?: string; directory?: string };
  assert.equal(body.submodule, "added");
  assert.equal(body.href, "brain/README.md");
  assert.equal(body.directory, checkout);
  const block = readFileSync(path.join(owner, ".edges", "compose", "README.md"), "utf8");
  assert.match(block, /\[brain\]\(<brain\/README\.md>\) — 个人大脑 remote: /);
  assert.doesNotMatch(readFileSync(path.join(owner, "AGENTS.md"), "utf8"), /edges-compose/);
  assert.doesNotMatch(block, new RegExp(`\\]\\(<${root.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
  assert.match(git(["config", "-f", ".gitmodules", "--get-regexp", "path"], owner), /\.edges\/compose\/brain/);
  assert.equal(readFileSync(path.join(checkout, "README.md"), "utf8"), "brain\n");

  // Same URL again: the submodule exists, so add only rewrites the line.
  const again = await run(
    ["compose", "add", "--name", "brain", "--remote", `${bare}/`, "--description", "个人大脑 v2"],
    { env },
  );
  assert.equal(again.exitCode, 0, again.stdout + again.stderr);
  assert.equal((JSON.parse(again.stdout) as { submodule?: string }).submodule, "existing");
  assert.match(readFileSync(path.join(owner, ".edges", "compose", "README.md"), "utf8"), /个人大脑 v2/);

  // A different URL at the same path is refused and the compose entry is left alone.
  const before = readFileSync(path.join(owner, ".edges", "compose", "README.md"), "utf8");
  const other = setupRemote(root, "other").bare;
  const clash = await run(
    ["compose", "add", "--name", "brain", "--remote", other, "--description", "x"],
    { env },
  );
  assert.notEqual(clash.exitCode, 0);
  assert.match(clash.stdout, /already points at/);
  assert.equal(readFileSync(path.join(owner, ".edges", "compose", "README.md"), "utf8"), before);
  commitAll(owner, "compose brain");

  // Fresh-clone state: the submodule directory is empty until compose update.
  git(["submodule", "deinit", "-q", "-f", ".edges/compose/brain"], owner);
  assert.deepEqual(readdirSync(checkout), []);
  const listed = await run(["compose", "list"], { env });
  assert.equal(listed.exitCode, 0, listed.stdout);
  assert.match(listed.stderr, /^warning: compose entry brain is not checked out at brain\/README\.md; run edges compose update --name brain$/m);

  const listedBody = JSON.parse(listed.stdout) as { entries: Array<{ name: string; initialized: boolean; href: string; entry?: string }> };
  assert.deepEqual(listedBody.entries.map((e) => [e.name, e.href, e.initialized]), [["brain", "brain/README.md", false]]);
  assert.equal(listedBody.entries[0]?.entry, path.join(checkout, "README.md"));

  const updated = await run(["compose", "update"], { env });
  assert.equal(updated.exitCode, 0, updated.stdout + updated.stderr);
  assert.equal((JSON.parse(updated.stdout) as GitEntries).entries[0]?.action, "initialized");
  assert.equal(readFileSync(path.join(checkout, "README.md"), "utf8"), "brain\n");
  const present = await run(["compose", "update", "--name", "brain"], { env });
  assert.equal((JSON.parse(present.stdout) as GitEntries).entries[0]?.action, "present");
  const relisted = await run(["compose", "list"], { env });
  assert.doesNotMatch(relisted.stderr, /not checked out/);
  assert.equal((JSON.parse(relisted.stdout) as { entries: Array<{ initialized: boolean }> }).entries[0]?.initialized, true);

  // Without --remote, update keeps the recorded commit; --remote follows the remote tip.
  commit(source, "upstream", "NOTE.md", "from-upstream\n");
  git(["push", "-q"], source);
  await run(["compose", "update"], { env });
  assert.equal(existsSync(path.join(checkout, "NOTE.md")), false);
  const followed = await run(["compose", "update", "--remote"], { env });
  assert.equal(followed.exitCode, 0, followed.stdout + followed.stderr);
  assert.equal((JSON.parse(followed.stdout) as GitEntries).entries[0]?.action, "updated");
  assert.equal(readFileSync(path.join(checkout, "NOTE.md"), "utf8"), "from-upstream\n");

  // Push is plain git inside the submodule; on a branch, update --remote merges and stays on it.
  git(["checkout", "-q", "-B", "main", "origin/main"], checkout);
  commit(checkout, "local", "LOCAL.md", "from-checkout\n");
  git(["push", "-q", "origin", "main"], checkout);
  assert.match(git(["--git-dir", bare, "log", "-1", "--format=%s", "main"]), /local/);
  git(["pull", "-q", "--ff-only"], source);
  commit(source, "upstream-2", "MORE.md", "more\n");
  git(["push", "-q"], source);
  const onBranch = await run(["compose", "update", "--remote", "--name", "brain"], { env });
  assert.equal(onBranch.exitCode, 0, onBranch.stdout + onBranch.stderr);
  assert.equal(git(["symbolic-ref", "--short", "HEAD"], checkout).trim(), "main");
  assert.equal(readFileSync(path.join(checkout, "MORE.md"), "utf8"), "more\n");
});

test("compose add rejects absolute and ~ paths and keeps a relative --path relative", async (t) => {
  const root = mkdtempSync(path.join(tmpdir(), "compose-path-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const owner = setupOwner(root);
  const env = { ...process.env, ...FILE_PROTOCOL, EDGES_SCOPE: owner };
  const before = readFileSync(path.join(owner, "AGENTS.md"), "utf8");
  for (const bad of [path.join(root, "abs"), "~/brain"]) {
    const result = await run(["compose", "add", "--name", "brain", "--path", bad, "--description", "x"], { env });
    assert.equal(result.exitCode, 2, bad);
    assert.equal(failed(result.stdout).errorCode, "VALIDATION_ERROR");
    assert.match(result.stdout, /must be relative/);
    assert.equal(readFileSync(path.join(owner, "AGENTS.md"), "utf8"), before);
    assert.equal(existsSync(path.join(owner, ".edges", "compose", "README.md")), false);
  }
  const { bare } = setupRemote(root, "team");
  const relative = await run(
    ["compose", "add", "--name", "team", "--path", "vendor/team", "--remote", bare, "--description", "团队库"],
    { env },
  );
  assert.equal(relative.exitCode, 0, relative.stdout + relative.stderr);
  assert.equal((JSON.parse(relative.stdout) as { submodule?: string }).submodule, "added");
  assert.match(readFileSync(path.join(owner, ".edges", "compose", "README.md"), "utf8"), /\[team\]\(<\.\.\/\.\.\/vendor\/team\/README\.md>\)/);
  assert.equal(existsSync(path.join(owner, "vendor", "team", "README.md")), true);

  // No --remote: a plain local directory, nothing runs in git.
  const local = await run(
    ["compose", "add", "--name", "notes", "--path", "../notes", "--description", "本地目录"],
    { env },
  );
  assert.equal(local.exitCode, 0, local.stdout + local.stderr);
  assert.match(readFileSync(path.join(owner, ".edges", "compose", "README.md"), "utf8"), /\[notes\]\(<\.\.\/\.\.\/\.\.\/notes\/README\.md>\)/);
  assert.doesNotMatch(readFileSync(path.join(owner, ".gitmodules"), "utf8"), /notes/);
});

test("compose update skips a failing submodule entry, warns, and still exits 0", async (t) => {
  const root = mkdtempSync(path.join(tmpdir(), "compose-sub-partial-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const good = setupRemote(root, "good");
  const owner = setupOwner(root);
  const env = { ...process.env, ...FILE_PROTOCOL, EDGES_SCOPE: owner };
  // "bad" is authored by hand (no .gitmodules record) with a remote that does not exist.
  mkdirSync(path.join(owner, ".edges", "compose"), { recursive: true });
  writeFileSync(path.join(owner, ".edges", "compose", "README.md"), composeReadme([
    `- [bad](<bad/README.md>) — 坏 remote: ${path.join(root, "missing.git")}`,
  ]));
  const registered = await run(["compose", "add", "--name", "good", "--remote", good.bare, "--description", "好"], { env });
  assert.equal(registered.exitCode, 0, registered.stdout + registered.stderr);
  git(["submodule", "deinit", "-q", "-f", ".edges/compose/good"], owner);

  const updated = await run(["compose", "update"], { env });
  assert.equal(updated.exitCode, 0, updated.stdout + updated.stderr);
  const body = JSON.parse(updated.stdout) as GitEntries;
  assert.equal(body.status, "success");
  assert.deepEqual(body.entries.map((e) => [e.name, e.action]), [["bad", "failed"], ["good", "initialized"]]);
  assert.ok(body.entries[0]?.error);
  assert.match(updated.stderr, /^warning: compose update failed for bad: /m);
  assert.doesNotMatch(updated.stderr, /for good/);

  const followed = await run(["compose", "update", "--remote"], { env });
  assert.equal(followed.exitCode, 0, followed.stdout + followed.stderr);
  assert.deepEqual((JSON.parse(followed.stdout) as GitEntries).entries.map((e) => [e.name, e.action]), [["bad", "failed"], ["good", "updated"]]);

  const single = await run(["compose", "update", "--name", "bad"], { env });
  assert.notEqual(single.exitCode, 0);
  const singleBody = JSON.parse(single.stdout) as GitEntries;
  assert.equal(singleBody.status, "failed");
  assert.deepEqual(singleBody.entries.map((e) => [e.name, e.action]), [["bad", "failed"]]);
});

function legacyEntries(_root: string, entries: Array<{ name: string; dir: string; remote: string }>): string {
  return composeReadme(entries.map((entry) => `- [${entry.name}](<${entry.dir}>) — ${entry.name} 仓 remote: ${entry.remote}`));
}

function writeLegacy(scope: string, source: string): void {
  writeFileSync(path.join(scope, "AGENTS.md"), agents());
  mkdirSync(path.join(scope, ".edges", "compose"), { recursive: true });
  writeFileSync(path.join(scope, ".edges", "compose", "README.md"), source);
}

test("legacy absolute entries: update clones when missing, pulls with --remote, and warns to migrate", async (t) => {
  const root = mkdtempSync(path.join(tmpdir(), "compose-legacy-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const scope = path.join(root, "scope");
  mkdirSync(scope, { recursive: true });
  const good = setupRemote(root, "good");
  const goodCheckout = path.join(root, "good");
  const badCheckout = path.join(root, "bad");
  // "bad" comes first so a failure there must not stop "good".
  writeLegacy(scope, legacyEntries(root, [
    { name: "bad", dir: badCheckout, remote: path.join(root, "missing.git") },
    { name: "good", dir: goodCheckout, remote: good.bare },
  ]));
  const env = { ...process.env, EDGES_SCOPE: scope };

  const listed = await run(["compose", "list"], { env });
  assert.equal(listed.exitCode, 0, listed.stdout);
  assert.match(listed.stderr, /^warning: compose entry good uses a legacy path .*migrate it to a git submodule at \.edges\/compose\/good \(edges compose add --name good/m);
  assert.match(listed.stderr, /^warning: compose entry good is not checked out at .*; run edges compose update --name good$/m);

  const updated = await run(["compose", "update"], { env });
  assert.equal(updated.exitCode, 0, updated.stdout + updated.stderr);
  const body = JSON.parse(updated.stdout) as GitEntries;
  assert.equal(body.status, "success");
  assert.deepEqual(body.entries.map((e) => [e.name, e.action]), [["bad", "failed"], ["good", "initialized"]]);
  assert.ok(body.entries[0]?.error);
  assert.match(updated.stderr, /^warning: compose update failed for bad: /m);
  assert.match(updated.stderr, /^warning: compose entry good uses a legacy path/m);
  assert.doesNotMatch(updated.stderr, /failed for good/);
  assert.equal(existsSync(path.join(goodCheckout, "README.md")), true);
  const again = await run(["compose", "update", "--name", "good"], { env });
  assert.equal((JSON.parse(again.stdout) as GitEntries).entries[0]?.action, "present");

  commit(good.source, "upstream", "NOTE.md", "from-upstream\n");
  git(["push", "-q"], good.source);
  const pulled = await run(["compose", "update", "--remote"], { env });
  assert.equal(pulled.exitCode, 0, pulled.stdout + pulled.stderr);
  assert.deepEqual((JSON.parse(pulled.stdout) as GitEntries).entries.map((e) => [e.name, e.action]), [["bad", "failed"], ["good", "updated"]]);
  assert.equal(readFileSync(path.join(goodCheckout, "NOTE.md"), "utf8"), "from-upstream\n");

  // Migrating: add with the same name and no --path replaces the legacy line.
  const owner = setupOwner(root, "owner");
  mkdirSync(path.join(owner, ".edges", "compose"), { recursive: true });
  writeFileSync(path.join(owner, ".edges", "compose", "README.md"), legacyEntries(root, [{ name: "good", dir: goodCheckout, remote: good.bare }]));
  const migrated = await run(
    ["compose", "add", "--name", "good", "--remote", good.bare, "--description", "好"],
    { env: { ...process.env, ...FILE_PROTOCOL, EDGES_SCOPE: owner } },
  );
  assert.equal(migrated.exitCode, 0, migrated.stdout + migrated.stderr);
  const source = readFileSync(path.join(owner, ".edges", "compose", "README.md"), "utf8");
  assert.match(source, /\[good\]\(<good\/README\.md>\)/);
  assert.equal(source.includes(goodCheckout), false);
});

test("compose update fails when every requested entry fails, including --name", async (t) => {
  const root = mkdtempSync(path.join(tmpdir(), "compose-allfail-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const scope = path.join(root, "scope");
  mkdirSync(scope, { recursive: true });
  writeLegacy(scope, legacyEntries(root, [
    { name: "one", dir: path.join(root, "one"), remote: path.join(root, "one.git") },
    { name: "two", dir: path.join(root, "two"), remote: path.join(root, "two.git") },
  ]));
  const env = { ...process.env, EDGES_SCOPE: scope };

  const updated = await run(["compose", "update"], { env });
  assert.notEqual(updated.exitCode, 0);
  const body = JSON.parse(updated.stdout) as GitEntries;
  assert.equal(body.status, "failed");
  assert.equal(body.errorCode, "UNKNOWN_ERROR");
  assert.match(body.reason ?? "", /all 2 entries/);
  assert.deepEqual(body.entries.map((e) => [e.name, e.action]), [["one", "failed"], ["two", "failed"]]);
  assert.match(updated.stderr, /^warning: compose update failed for one: /m);
  assert.match(updated.stderr, /^warning: compose update failed for two: /m);

  const single = await run(["compose", "update", "--remote", "--name", "two"], { env });
  assert.notEqual(single.exitCode, 0);
  const singleBody = JSON.parse(single.stdout) as GitEntries;
  assert.equal(singleBody.status, "failed");
  assert.deepEqual(singleBody.entries.map((e) => [e.name, e.action]), [["two", "failed"]]);
  assert.equal(singleBody.reason, singleBody.entries[0]?.error);

  const unknown = await run(["compose", "update", "--name", "nope"], { env });
  assert.equal(unknown.exitCode, 2);
  assert.match(unknown.stdout, /compose entry not found: nope/);
  assert.doesNotMatch(unknown.stdout, /"entries"/);
});

test("Compose never recurses: two repos registering each other stay one layer deep", async (t) => {
  const root = realpathSync(mkdtempSync(path.join(tmpdir(), "compose-mutual-")));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const harness = (title: string) => agents().replace("# Scope", `# ${title}`);
  const a = setupRemote(root, "a", { "AGENTS.md": harness("A"), "README.md": "# A\n" });
  const b = setupRemote(root, "b", { "AGENTS.md": harness("B"), "README.md": "# B\n" });

  // B registers A, A registers B: each is a git submodule of the other.
  const inB = await run(
    ["compose", "add", "--name", "a", "--remote", a.bare, "--description", "A 仓"],
    { env: { ...process.env, ...FILE_PROTOCOL, EDGES_SCOPE: b.source } },
  );
  assert.equal(inB.exitCode, 0, inB.stdout + inB.stderr);
  commitAll(b.source, "compose a");
  git(["push", "-q"], b.source);
  const env = { ...process.env, ...FILE_PROTOCOL, EDGES_SCOPE: a.source };
  const inA = await run(
    ["compose", "add", "--name", "b", "--remote", b.bare, "--description", "B 仓"],
    { env },
  );
  assert.equal(inA.exitCode, 0, inA.stdout + inA.stderr);
  commitAll(a.source, "compose b");

  const bCheckout = path.join(a.source, ".edges", "compose", "b");
  const nested = path.join(bCheckout, ".edges", "compose", "a");
  // Fresh-clone state, then compose update: never --recursive, so B's own entry stays empty.
  git(["submodule", "deinit", "-q", "-f", ".edges/compose/b"], a.source);
  const hint = await run(["forest", "list", "--no-super"], { env });
  assert.equal(hint.exitCode, 0, hint.stdout + hint.stderr);
  assert.match(hint.stderr, /^warning: compose entry b is not checked out at b\/README\.md; run edges compose update --name b$/m);
  const cloned = await run(["compose", "update"], { env });
  assert.equal(cloned.exitCode, 0, cloned.stdout + cloned.stderr);
  assert.equal(existsSync(path.join(bCheckout, "AGENTS.md")), true);
  assert.deepEqual(readdirSync(nested), []);
  const cloneBody = JSON.parse(cloned.stdout) as GitEntries;
  assert.deepEqual(cloneBody.entries.map((e) => e.name), ["b"]);
  assert.doesNotMatch((await run(["forest", "list", "--no-super"], { env })).stderr, /not checked out/);

  // Even with B's own submodule initialized by hand, nothing below B is read.
  gitSub(["submodule", "update", "--init", "-q"], bCheckout);
  assert.equal(existsSync(path.join(nested, "AGENTS.md")), true);

  const service = new NodeService({ managedRoot: a.source });
  const plain = (await service.list(a.source)).map((node) => node.path);
  assert.deepEqual(plain.filter((file) => file.startsWith(bCheckout)), [path.join(bCheckout, "README.md")]);
  assert.equal(plain.includes(path.join(nested, "AGENTS.md")), false);
  assert.equal(plain.includes(path.join(nested, "README.md")), false);
  const skipped = (await service.list(a.source, { exclude: new Set(["compose"]) })).map((node) => node.path);
  assert.deepEqual(skipped.filter((file) => file.startsWith(bCheckout) || file.includes(`${path.sep}compose${path.sep}`)), []);

  // The forest scan includes the scope's own compose checkout, and never a nested one.
  const forest = await buildSystemForest(a.source, { includeSuper: false });
  assert.deepEqual(forest.map((tree) => tree[0]?.path).sort(), [
    path.join(a.source, "AGENTS.md"),
    path.join(bCheckout, "AGENTS.md"),
  ].sort());
  const forestPaths = forest.flat().map((node) => node.path);
  assert.equal(forestPaths.includes(path.join(bCheckout, "AGENTS.md")), true);
  assert.equal(forestPaths.includes(path.join(nested, "AGENTS.md")), false);
  const excludedForest = await buildSystemForest(a.source, { includeSuper: false, exclude: new Set(["compose"]) });
  assert.deepEqual(excludedForest.map((tree) => tree[0]?.path), [path.join(a.source, "AGENTS.md")]);
  const cli = await run(["forest", "list", "--no-super"], { env });
  const trees = (JSON.parse(cli.stdout) as { trees: Array<{ root: string }> }).trees.map((tree) => tree.root);
  assert.deepEqual(trees.sort(), [".edges/compose/b/AGENTS.md", "AGENTS.md"]);
  const excludedCli = await run(["--exclude", "compose", "forest", "list", "--no-super"], { env });
  assert.equal(excludedCli.exitCode, 0, excludedCli.stdout + excludedCli.stderr);
  assert.deepEqual(
    (JSON.parse(excludedCli.stdout) as { trees: Array<{ root: string }> }).trees.map((tree) => tree.root),
    ["AGENTS.md"],
  );

  // compose list only shows A's own entry, never B's.
  const listed = JSON.parse((await run(["compose", "list"], { env })).stdout) as { entries: Array<{ name: string }> };
  assert.deepEqual(listed.entries.map((entry) => entry.name), ["b"]);
});

test("compose update without a scope AGENTS.md still fails the whole command", async (t) => {
  const root = mkdtempSync(path.join(tmpdir(), "compose-noscope-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const result = await run(["compose", "update"], { env: { ...process.env, EDGES_SCOPE: root } });
  assert.notEqual(result.exitCode, 0);
  assert.equal(failed(result.stdout).status, "failed");
  assert.doesNotMatch(result.stdout, /"entries"/);
});

test("unknown --exclude names are a hard error", async (t) => {
  const root = mkdtempSync(path.join(tmpdir(), "compose-exclude-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(root, { recursive: true });
  writeFileSync(path.join(root, "AGENTS.md"), agents());
  const env = { ...process.env, EDGES_SCOPE: root };
  const unknown = await run(["--exclude", "widgets", "compose", "list"], { env });
  assert.notEqual(unknown.exitCode, 0);
  assert.match(unknown.stdout, /Unknown module in --exclude: widgets/);
  assert.match(unknown.stdout, /compose, memory, skills, notes, projects, tasks/);
  const empty = await run(["--exclude", "compose,", "notes", "list"], { env });
  assert.notEqual(empty.exitCode, 0);
  assert.match(empty.stdout, /--exclude needs a module name/);
});

test("compose doctor dry-run reports the move and --apply writes it once", async (t) => {
  const root = mkdtempSync(path.join(tmpdir(), "compose-doctor-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const scope = path.join(root, "scope");
  mkdirSync(scope, { recursive: true });
  const agentsFile = path.join(scope, "AGENTS.md");
  writeFileSync(agentsFile, agents(composeBlock([
    "- [brain](<.edges/compose/brain>) — 个人大脑 remote: https://github.com/example/brain.git",
    "- [team](<vendor/team>) — 团队库",
  ])));
  writeFileSync(path.join(scope, "NOTES.md"), "Run edges --with-composed forest list\n");
  writeFileSync(path.join(scope, "sample.test.ts"), "await run([\"--with-composed\", \"notes\", \"list\"]);\n");
  const env = { ...process.env, EDGES_SCOPE: scope };
  const beforeAgents = readFileSync(agentsFile, "utf8");

  const dry = await run(["compose", "doctor"], { env });
  assert.equal(dry.exitCode, 0, dry.stdout + dry.stderr);
  const dryBody = JSON.parse(dry.stdout) as { apply: boolean; changes: Array<{ kind: string; detail?: string }> };
  assert.equal(dryBody.apply, false);
  const kinds = dryBody.changes.map((change) => change.kind);
  assert.ok(kinds.includes("move-block"));
  assert.ok(kinds.includes("rewrite-href"));
  assert.ok(kinds.includes("index-link"));
  assert.ok(kinds.includes("clear-agents"));
  assert.equal(kinds.filter((kind) => kind === "docs").length, 2);
  assert.ok(dryBody.changes.some((change) => change.detail === ".edges/compose/brain -> brain/README.md"));
  assert.ok(dryBody.changes.some((change) => change.detail === "vendor/team -> ../../vendor/team/README.md"));
  assert.equal(readFileSync(agentsFile, "utf8"), beforeAgents);
  assert.equal(existsSync(path.join(scope, ".edges", "compose", "README.md")), false);
  assert.match(readFileSync(path.join(scope, "NOTES.md"), "utf8"), /--with-composed/);

  const applied = await run(["compose", "doctor", "--apply"], { env });
  assert.equal(applied.exitCode, 0, applied.stdout + applied.stderr);
  assert.equal((JSON.parse(applied.stdout) as { apply: boolean }).apply, true);
  const composeFile = readFileSync(path.join(scope, ".edges", "compose", "README.md"), "utf8");
  assert.match(composeFile, /\[brain\]\(<brain\/README\.md>\) — 个人大脑 remote: https:\/\/github\.com\/example\/brain\.git/);
  assert.match(composeFile, /\[team\]\(<\.\.\/\.\.\/vendor\/team\/README\.md>\) — 团队库/);
  const agentsAfter = readFileSync(agentsFile, "utf8");
  assert.doesNotMatch(agentsAfter, /edges-compose/);
  assert.match(agentsAfter, /\.edges\/README\.md/);
  assert.match(readFileSync(path.join(scope, ".edges", "README.md"), "utf8"), /compose\/README\.md/);
  assert.equal(readFileSync(path.join(scope, "NOTES.md"), "utf8"), "Run edges --with-composed forest list\n");
  assert.match(readFileSync(path.join(scope, "sample.test.ts"), "utf8"), /--with-composed/);

  const again = await run(["compose", "doctor"], { env });
  assert.equal(again.exitCode, 0, again.stdout + again.stderr);
  const againChanges = (JSON.parse(again.stdout) as { changes: Array<{ kind: string; detail?: string }> }).changes;
  assert.deepEqual(againChanges.map((change) => change.kind), ["docs", "docs"]);
  assert.ok(againChanges.every((change) => change.detail === "mentions --with-composed; left unchanged"));
  assert.equal(readFileSync(path.join(scope, ".edges", "compose", "README.md"), "utf8"), composeFile);
});

test("compose doctor leaves --with-composed prose in place and skips skills and history", async (t) => {
  const root = mkdtempSync(path.join(tmpdir(), "compose-doctor-prose-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(path.join(root, ".agents", "skills", "edges-compose"), { recursive: true });
  mkdirSync(path.join(root, "docs", "adr"), { recursive: true });
  writeFileSync(path.join(root, "AGENTS.md"), agents());
  const skill = "经 `--with-composed` 展开\n";
  const changelog = "旧命令使用 --with-composed。\n";
  const adr = "当时的开关是 --with-composed。\n";
  const notes = "经 `--with-composed` 展开\n";
  writeFileSync(path.join(root, ".agents", "skills", "edges-compose", "SKILL.md"), skill);
  writeFileSync(path.join(root, "CHANGELOG.md"), changelog);
  writeFileSync(path.join(root, "docs", "adr", "0042-example.md"), adr);
  writeFileSync(path.join(root, "NOTES.md"), notes);
  const env = { ...process.env, EDGES_SCOPE: root };

  const applied = await run(["compose", "doctor", "--apply"], { env });
  assert.equal(applied.exitCode, 0, applied.stdout + applied.stderr);
  const changes = (JSON.parse(applied.stdout) as { changes: Array<{ kind: string; path: string; detail?: string }> }).changes;
  assert.deepEqual(changes.map((change) => path.basename(change.path)), ["NOTES.md"]);
  assert.equal(changes[0]?.detail, "mentions --with-composed; left unchanged");
  assert.equal(readFileSync(path.join(root, ".agents", "skills", "edges-compose", "SKILL.md"), "utf8"), skill);
  assert.equal(readFileSync(path.join(root, "CHANGELOG.md"), "utf8"), changelog);
  assert.equal(readFileSync(path.join(root, "docs", "adr", "0042-example.md"), "utf8"), adr);
  assert.equal(readFileSync(path.join(root, "NOTES.md"), "utf8"), notes);
  assert.doesNotMatch(readFileSync(path.join(root, "NOTES.md"), "utf8"), /经 `` 展开/);
});

test("compose doctor does nothing when AGENTS.md has no Compose block", async (t) => {
  const root = mkdtempSync(path.join(tmpdir(), "compose-doctor-empty-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(root, { recursive: true });
  writeFileSync(path.join(root, "AGENTS.md"), agents());
  const result = await run(["compose", "doctor", "--apply"], { env: { ...process.env, EDGES_SCOPE: root } });
  assert.equal(result.exitCode, 0, result.stdout + result.stderr);
  assert.deepEqual((JSON.parse(result.stdout) as { changes: unknown[] }).changes, []);
  assert.equal(existsSync(path.join(root, ".edges", "compose", "README.md")), false);
});

test("compose update --help documents --remote and per-entry failure handling", async () => {
  const result = await run(["compose", "update", "--help"]);
  assert.equal(result.exitCode, 0);
  assert.match(result.stdout, /--remote/);
  assert.match(result.stdout, /never\s+--recursive/);
  assert.match(result.stdout, /action "failed"/);
  assert.match(result.stdout, /every requested entry/);
});
