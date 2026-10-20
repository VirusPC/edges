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

<!-- project-harness:start -->
<!-- project-harness-constraints:start -->
## 本层硬约束

- keep
<!-- project-harness-constraints:end -->
${body}<!-- project-harness:end -->
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

test("compose register --help marks --description as required", async () => {
  const result = await run(["compose", "register", "--help"]);
  assert.equal(result.exitCode, 0);
  assert.match(result.stdout, /--description\s+<text>/);
  assert.match(result.stdout, /required/i);
});

test("compose register without --description is a validation error and leaves AGENTS.md unchanged", async (t) => {
  const root = mkdtempSync(path.join(tmpdir(), "compose-register-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const scope = path.join(root, "scope");
  mkdirSync(scope, { recursive: true });
  const file = path.join(scope, "AGENTS.md");
  const before = agents();
  writeFileSync(file, before);
  const env = { ...process.env, EDGES_SCOPE: scope };

  const missing = await run(
    ["compose", "register", "--name", "brain", "--remote", "https://github.com/example/brain.git"],
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
    ["compose", "register", "--name", "brain", "--remote", "https://github.com/example/brain.git", "--description", ""],
    { env },
  );
  assert.equal(empty.exitCode, 2);
  const emptyBody = failed(empty.stdout);
  assert.equal(emptyBody.errorCode, "VALIDATION_ERROR");
  assert.match(emptyBody.reason, /--description/);
  assert.match(emptyBody.reason, /required/i);
  assert.equal(readFileSync(file, "utf8"), before);

  const blank = await run(
    ["compose", "register", "--name", "brain", "--description", "   "],
    { env },
  );
  assert.equal(blank.exitCode, 2);
  assert.equal(failed(blank.stdout).errorCode, "VALIDATION_ERROR");
  assert.equal(readFileSync(file, "utf8"), before);
});

test("compose register writes the description into the Compose block", async (t) => {
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
      "register",
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
  const source = readFileSync(file, "utf8");
  assert.match(
    source,
    /\[brain\]\(<\.harness\/compose\/brain>\) — 个人大脑：只在记跨项目判断时写入 remote: https:\/\/github\.com\/example\/brain\.git/,
  );
  const body = JSON.parse(registered.stdout) as { description?: string; href?: string; submodule?: string };
  assert.equal(body.description, "个人大脑：只在记跨项目判断时写入");
  assert.equal(body.href, ".harness/compose/brain");
  assert.equal(body.submodule, undefined);
  // The scope is not a git repo: no submodule add, and a hint on stderr.
  assert.match(registered.stderr, /^warning: compose entry brain is outside the owner's git repo; skipped git submodule add/m);
});

test("edges compose --help lists clone, pull, and push", async () => {
  const result = await run(["compose", "--help"]);
  assert.equal(result.exitCode, 0);
  assert.match(result.stdout, /^\s+clone\b/m);
  assert.match(result.stdout, /^\s+pull\b/m);
  assert.match(result.stdout, /^\s+push\b/m);
  assert.match(result.stdout, /^\s+register\b/m);
  assert.match(result.stdout, /^\s+unregister\b/m);
  assert.match(result.stdout, /^\s+list\b/m);
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
  return `<!-- project-harness-compose:start -->
## 组合

${lines.join("\n")}
<!-- project-harness-compose:end -->
`;
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

test("compose register --remote adds a git submodule at .harness/compose/<name> with a relative href", async (t) => {
  const root = mkdtempSync(path.join(tmpdir(), "compose-sub-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { bare, source } = setupRemote(root, "brain");
  const owner = setupOwner(root);
  const env = { ...process.env, ...FILE_PROTOCOL, EDGES_SCOPE: owner };
  const checkout = path.join(owner, ".harness", "compose", "brain");

  const registered = await run(
    ["compose", "register", "--name", "brain", "--remote", bare, "--description", "个人大脑"],
    { env },
  );
  assert.equal(registered.exitCode, 0, registered.stdout + registered.stderr);
  const body = JSON.parse(registered.stdout) as { submodule?: string; href?: string; directory?: string };
  assert.equal(body.submodule, "added");
  assert.equal(body.href, ".harness/compose/brain");
  assert.equal(body.directory, checkout);
  const block = readFileSync(path.join(owner, "AGENTS.md"), "utf8");
  assert.match(block, /\[brain\]\(<\.harness\/compose\/brain>\) — 个人大脑 remote: /);
  assert.doesNotMatch(block, new RegExp(`\\]\\(<${root.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
  assert.match(git(["config", "-f", ".gitmodules", "--get-regexp", "path"], owner), /\.harness\/compose\/brain/);
  assert.equal(readFileSync(path.join(checkout, "README.md"), "utf8"), "brain\n");

  // Same URL again: the submodule exists, so register only rewrites the line.
  const again = await run(
    ["compose", "register", "--name", "brain", "--remote", `${bare}/`, "--description", "个人大脑 v2"],
    { env },
  );
  assert.equal(again.exitCode, 0, again.stdout + again.stderr);
  assert.equal((JSON.parse(again.stdout) as { submodule?: string }).submodule, "existing");
  assert.match(readFileSync(path.join(owner, "AGENTS.md"), "utf8"), /个人大脑 v2/);

  // A different URL at the same path is refused and AGENTS.md is left alone.
  const before = readFileSync(path.join(owner, "AGENTS.md"), "utf8");
  const other = setupRemote(root, "other").bare;
  const clash = await run(
    ["compose", "register", "--name", "brain", "--remote", other, "--description", "x"],
    { env },
  );
  assert.notEqual(clash.exitCode, 0);
  assert.match(clash.stdout, /already points at/);
  assert.equal(readFileSync(path.join(owner, "AGENTS.md"), "utf8"), before);
  commitAll(owner, "compose brain");

  // Fresh-clone state: the submodule directory is empty until compose clone.
  git(["submodule", "deinit", "-q", "-f", ".harness/compose/brain"], owner);
  assert.deepEqual(readdirSync(checkout), []);
  const listed = await run(["compose", "list"], { env });
  assert.equal(listed.exitCode, 0, listed.stdout);
  assert.match(listed.stderr, /^warning: compose entry brain is not checked out at \.harness\/compose\/brain; run edges compose clone --name brain$/m);

  const cloned = await run(["compose", "clone"], { env });
  assert.equal(cloned.exitCode, 0, cloned.stdout + cloned.stderr);
  assert.equal((JSON.parse(cloned.stdout) as GitEntries).entries[0]?.action, "cloned");
  assert.equal(readFileSync(path.join(checkout, "README.md"), "utf8"), "brain\n");
  const present = await run(["compose", "clone", "--name", "brain"], { env });
  assert.equal((JSON.parse(present.stdout) as GitEntries).entries[0]?.action, "present");
  assert.doesNotMatch((await run(["compose", "list"], { env })).stderr, /not checked out/);

  commit(source, "upstream", "NOTE.md", "from-upstream\n");
  git(["push", "-q"], source);
  const pulled = await run(["compose", "pull"], { env });
  assert.equal(pulled.exitCode, 0, pulled.stdout + pulled.stderr);
  assert.equal((JSON.parse(pulled.stdout) as GitEntries).entries[0]?.action, "pulled");
  assert.equal(readFileSync(path.join(checkout, "NOTE.md"), "utf8"), "from-upstream\n");

  // Submodules check out a detached HEAD; push refuses with a clear message.
  const detached = await run(["compose", "push", "--name", "brain"], { env });
  assert.notEqual(detached.exitCode, 0);
  const detachedBody = JSON.parse(detached.stdout) as GitEntries;
  assert.match(detachedBody.reason ?? "", /detached HEAD/);
  assert.match(detached.stderr, /^warning: compose push failed for brain: Compose checkout is on a detached HEAD/m);

  git(["checkout", "-q", "-B", "main", "origin/main"], checkout);
  commit(checkout, "local", "LOCAL.md", "from-checkout\n");
  const pushed = await run(["compose", "push"], { env });
  assert.equal(pushed.exitCode, 0, pushed.stdout + pushed.stderr);
  assert.equal((JSON.parse(pushed.stdout) as GitEntries).entries[0]?.action, "pushed");
  assert.match(git(["--git-dir", bare, "log", "-1", "--format=%s", "main"]), /local/);

  // On a branch, pull merges the remote tip and stays on that branch.
  git(["pull", "-q", "--ff-only"], source);
  commit(source, "upstream-2", "MORE.md", "more\n");
  git(["push", "-q"], source);
  const pulledOnBranch = await run(["compose", "pull", "--name", "brain"], { env });
  assert.equal(pulledOnBranch.exitCode, 0, pulledOnBranch.stdout + pulledOnBranch.stderr);
  assert.equal(git(["symbolic-ref", "--short", "HEAD"], checkout).trim(), "main");
  assert.equal(readFileSync(path.join(checkout, "MORE.md"), "utf8"), "more\n");
});

test("compose register rejects absolute and ~ paths and keeps a relative --path relative", async (t) => {
  const root = mkdtempSync(path.join(tmpdir(), "compose-path-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const owner = setupOwner(root);
  const env = { ...process.env, ...FILE_PROTOCOL, EDGES_SCOPE: owner };
  const before = readFileSync(path.join(owner, "AGENTS.md"), "utf8");
  for (const bad of [path.join(root, "abs"), "~/brain"]) {
    const result = await run(["compose", "register", "--name", "brain", "--path", bad, "--description", "x"], { env });
    assert.equal(result.exitCode, 2, bad);
    assert.equal(failed(result.stdout).errorCode, "VALIDATION_ERROR");
    assert.match(result.stdout, /must be relative/);
    assert.equal(readFileSync(path.join(owner, "AGENTS.md"), "utf8"), before);
  }
  const { bare } = setupRemote(root, "team");
  const relative = await run(
    ["compose", "register", "--name", "team", "--path", "vendor/team", "--remote", bare, "--description", "团队库"],
    { env },
  );
  assert.equal(relative.exitCode, 0, relative.stdout + relative.stderr);
  assert.equal((JSON.parse(relative.stdout) as { submodule?: string }).submodule, "added");
  assert.match(readFileSync(path.join(owner, "AGENTS.md"), "utf8"), /\[team\]\(<vendor\/team>\)/);
  assert.equal(existsSync(path.join(owner, "vendor", "team", "README.md")), true);

  // No --remote: a plain local directory, nothing runs in git.
  const local = await run(
    ["compose", "register", "--name", "notes", "--path", "../notes", "--description", "本地目录"],
    { env },
  );
  assert.equal(local.exitCode, 0, local.stdout + local.stderr);
  assert.match(readFileSync(path.join(owner, "AGENTS.md"), "utf8"), /\[notes\]\(<\.\.\/notes>\)/);
  assert.doesNotMatch(readFileSync(path.join(owner, ".gitmodules"), "utf8"), /notes/);
});

test("compose submodule clone/pull/push skip a failing entry, warn, and still exit 0", async (t) => {
  const root = mkdtempSync(path.join(tmpdir(), "compose-sub-partial-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const good = setupRemote(root, "good");
  const owner = setupOwner(root);
  const env = { ...process.env, ...FILE_PROTOCOL, EDGES_SCOPE: owner };
  // "bad" is authored by hand (no .gitmodules record) with a remote that does not exist.
  writeFileSync(path.join(owner, "AGENTS.md"), agents(composeBlock([
    `- [bad](<.harness/compose/bad>) — 坏 remote: ${path.join(root, "missing.git")}`,
  ])));
  const registered = await run(["compose", "register", "--name", "good", "--remote", good.bare, "--description", "好"], { env });
  assert.equal(registered.exitCode, 0, registered.stdout + registered.stderr);
  git(["submodule", "deinit", "-q", "-f", ".harness/compose/good"], owner);

  const cloned = await run(["compose", "clone"], { env });
  assert.equal(cloned.exitCode, 0, cloned.stdout + cloned.stderr);
  const cloneBody = JSON.parse(cloned.stdout) as GitEntries;
  assert.deepEqual(cloneBody.entries.map((e) => [e.name, e.action]), [["bad", "failed"], ["good", "cloned"]]);
  assert.match(cloned.stderr, /^warning: compose clone failed for bad: /m);
  assert.doesNotMatch(cloned.stderr, /for good/);

  const pulled = await run(["compose", "pull"], { env });
  assert.equal(pulled.exitCode, 0, pulled.stdout + pulled.stderr);
  const pullBody = JSON.parse(pulled.stdout) as GitEntries;
  assert.deepEqual(pullBody.entries.map((e) => [e.name, e.action]), [["bad", "failed"], ["good", "pulled"]]);
  assert.match(pullBody.entries[0]?.error ?? "", /not a git submodule yet: bad/);

  const pushed = await run(["compose", "push"], { env });
  const pushBody = JSON.parse(pushed.stdout) as GitEntries;
  // Both fail: bad is missing, good is on the detached HEAD a submodule checks out.
  assert.notEqual(pushed.exitCode, 0);
  assert.equal(pushBody.reason, "compose push failed for all 2 entries");
  assert.match(pushBody.entries[0]?.error ?? "", /Compose checkout is missing: bad/);
  assert.match(pushBody.entries[1]?.error ?? "", /detached HEAD/);
});

function legacyEntries(root: string, entries: Array<{ name: string; dir: string; remote: string }>): string {
  return agents(composeBlock(entries.map((entry) => `- [${entry.name}](<${entry.dir}>) — ${entry.name} 仓 remote: ${entry.remote}`)));
}

test("legacy absolute entries still clone/pull/push with plain git and warn to migrate", async (t) => {
  const root = mkdtempSync(path.join(tmpdir(), "compose-legacy-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const scope = path.join(root, "scope");
  mkdirSync(scope, { recursive: true });
  const good = setupRemote(root, "good");
  const goodCheckout = path.join(root, "good");
  const badCheckout = path.join(root, "bad");
  // "bad" comes first so a failure there must not stop "good".
  writeFileSync(path.join(scope, "AGENTS.md"), legacyEntries(root, [
    { name: "bad", dir: badCheckout, remote: path.join(root, "missing.git") },
    { name: "good", dir: goodCheckout, remote: good.bare },
  ]));
  const env = { ...process.env, EDGES_SCOPE: scope };

  const listed = await run(["compose", "list"], { env });
  assert.equal(listed.exitCode, 0, listed.stdout);
  assert.match(listed.stderr, /^warning: compose entry good uses a legacy path .*migrate it to a git submodule at \.harness\/compose\/good/m);

  const cloned = await run(["compose", "clone"], { env });
  assert.equal(cloned.exitCode, 0, cloned.stdout + cloned.stderr);
  const cloneBody = JSON.parse(cloned.stdout) as GitEntries;
  assert.equal(cloneBody.status, "success");
  assert.deepEqual(cloneBody.entries.map((e) => [e.name, e.action]), [["bad", "failed"], ["good", "cloned"]]);
  assert.ok(cloneBody.entries[0]?.error);
  assert.match(cloned.stderr, /^warning: compose clone failed for bad: /m);
  assert.match(cloned.stderr, /^warning: compose entry good uses a legacy path/m);
  assert.doesNotMatch(cloned.stderr, /failed for good/);
  assert.equal(existsSync(path.join(goodCheckout, "README.md")), true);
  const again = await run(["compose", "clone", "--name", "good"], { env });
  assert.equal((JSON.parse(again.stdout) as GitEntries).entries[0]?.action, "present");

  commit(good.source, "upstream", "NOTE.md", "from-upstream\n");
  git(["push", "-q"], good.source);
  const pulled = await run(["compose", "pull"], { env });
  assert.equal(pulled.exitCode, 0, pulled.stdout + pulled.stderr);
  const pullBody = JSON.parse(pulled.stdout) as GitEntries;
  assert.deepEqual(pullBody.entries.map((e) => [e.name, e.action]), [["bad", "failed"], ["good", "pulled"]]);
  assert.equal(pullBody.entries[0]?.error, "Compose checkout is missing: bad");
  assert.match(pulled.stderr, /^warning: compose pull failed for bad: Compose checkout is missing: bad$/m);
  assert.equal(readFileSync(path.join(goodCheckout, "NOTE.md"), "utf8"), "from-upstream\n");

  commit(goodCheckout, "local", "LOCAL.md", "from-checkout\n");
  const pushed = await run(["compose", "push"], { env });
  assert.equal(pushed.exitCode, 0, pushed.stdout + pushed.stderr);
  assert.deepEqual((JSON.parse(pushed.stdout) as GitEntries).entries.map((e) => [e.name, e.action]), [["bad", "failed"], ["good", "pushed"]]);
  assert.match(git(["--git-dir", good.bare, "log", "-1", "--format=%s", "main"]), /local/);

  const removed = await run(["compose", "unregister", "--name", "good"], { env });
  assert.equal(removed.exitCode, 0, removed.stdout + removed.stderr);
  assert.equal(existsSync(path.join(goodCheckout, "README.md")), true);
  assert.doesNotMatch(readFileSync(path.join(scope, "AGENTS.md"), "utf8"), /\[good\]/);
  const missing = await run(["compose", "unregister", "--name", "good"], { env });
  assert.notEqual(missing.exitCode, 0);
  assert.match(missing.stdout, /Compose entry not found: good/);
});

test("compose pull/push fail when every requested entry fails, including --name", async (t) => {
  const root = mkdtempSync(path.join(tmpdir(), "compose-allfail-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const scope = path.join(root, "scope");
  mkdirSync(scope, { recursive: true });
  writeFileSync(path.join(scope, "AGENTS.md"), legacyEntries(root, [
    { name: "one", dir: path.join(root, "one"), remote: path.join(root, "one.git") },
    { name: "two", dir: path.join(root, "two"), remote: path.join(root, "two.git") },
  ]));
  const env = { ...process.env, EDGES_SCOPE: scope };

  const pulled = await run(["compose", "pull"], { env });
  assert.notEqual(pulled.exitCode, 0);
  const body = JSON.parse(pulled.stdout) as GitEntries;
  assert.equal(body.status, "failed");
  assert.equal(body.errorCode, "UNKNOWN_ERROR");
  assert.match(body.reason ?? "", /all 2 entries/);
  assert.deepEqual(body.entries.map((e) => [e.name, e.action]), [["one", "failed"], ["two", "failed"]]);
  assert.match(pulled.stderr, /^warning: compose pull failed for one: /m);
  assert.match(pulled.stderr, /^warning: compose pull failed for two: /m);

  const single = await run(["compose", "push", "--name", "two"], { env });
  assert.notEqual(single.exitCode, 0);
  const singleBody = JSON.parse(single.stdout) as GitEntries;
  assert.equal(singleBody.status, "failed");
  assert.equal(singleBody.reason, "Compose checkout is missing: two");
  assert.deepEqual(singleBody.entries.map((e) => [e.name, e.action]), [["two", "failed"]]);

  const cloned = await run(["compose", "clone"], { env });
  assert.notEqual(cloned.exitCode, 0);
  assert.equal((JSON.parse(cloned.stdout) as GitEntries).status, "failed");

  const unknown = await run(["compose", "pull", "--name", "nope"], { env });
  assert.equal(unknown.exitCode, 2);
  assert.match(unknown.stdout, /compose entry not found: nope/);
  assert.doesNotMatch(unknown.stdout, /"entries"/);
});

test("Compose never recurses: two repos registering each other stay one layer deep", async (t) => {
  const root = realpathSync(mkdtempSync(path.join(tmpdir(), "compose-mutual-")));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const harness = (title: string) => agents().replace("# Scope", `# ${title}`);
  const a = setupRemote(root, "a", { "AGENTS.md": harness("A") });
  const b = setupRemote(root, "b", { "AGENTS.md": harness("B") });

  // B registers A, A registers B: each is a git submodule of the other.
  const inB = await run(
    ["compose", "register", "--name", "a", "--remote", a.bare, "--description", "A 仓"],
    { env: { ...process.env, ...FILE_PROTOCOL, EDGES_SCOPE: b.source } },
  );
  assert.equal(inB.exitCode, 0, inB.stdout + inB.stderr);
  commitAll(b.source, "compose a");
  git(["push", "-q"], b.source);
  const env = { ...process.env, ...FILE_PROTOCOL, EDGES_SCOPE: a.source };
  const inA = await run(
    ["compose", "register", "--name", "b", "--remote", b.bare, "--description", "B 仓"],
    { env },
  );
  assert.equal(inA.exitCode, 0, inA.stdout + inA.stderr);
  commitAll(a.source, "compose b");

  const bCheckout = path.join(a.source, ".harness", "compose", "b");
  const nested = path.join(bCheckout, ".harness", "compose", "a");
  // Fresh-clone state, then compose clone: never --recursive, so B's own entry stays empty.
  git(["submodule", "deinit", "-q", "-f", ".harness/compose/b"], a.source);
  const hint = await run(["--with-composed", "forest", "list", "--no-super"], { env });
  assert.equal(hint.exitCode, 0, hint.stdout + hint.stderr);
  assert.match(hint.stderr, /^warning: compose entry b is not checked out at \.harness\/compose\/b; run edges compose clone --name b$/m);
  const cloned = await run(["compose", "clone"], { env });
  assert.equal(cloned.exitCode, 0, cloned.stdout + cloned.stderr);
  assert.equal(existsSync(path.join(bCheckout, "AGENTS.md")), true);
  assert.deepEqual(readdirSync(nested), []);
  const cloneBody = JSON.parse(cloned.stdout) as GitEntries;
  assert.deepEqual(cloneBody.entries.map((e) => e.name), ["b"]);
  assert.doesNotMatch((await run(["--with-composed", "forest", "list", "--no-super"], { env })).stderr, /not checked out/);

  // Even with B's own submodule initialized by hand, nothing below B is read.
  gitSub(["submodule", "update", "--init", "-q"], bCheckout);
  assert.equal(existsSync(path.join(nested, "AGENTS.md")), true);

  const service = new NodeService({ managedRoot: a.source });
  const plain = (await service.list(a.source)).map((node) => node.path);
  assert.deepEqual(plain.filter((file) => file.startsWith(bCheckout)), []);
  const composed = (await service.list(a.source, { withComposed: true })).map((node) => node.path);
  assert.deepEqual(composed.filter((file) => file.startsWith(bCheckout)), [path.join(bCheckout, "AGENTS.md")]);
  assert.equal(composed.includes(path.join(nested, "AGENTS.md")), false);

  // The forest scan does not pick up composed repos as extra roots either.
  const forest = await buildSystemForest(a.source, { includeSuper: false, withComposed: true });
  assert.deepEqual(forest.map((tree) => tree[0]?.path), [path.join(a.source, "AGENTS.md")]);
  const forestPaths = forest.flat().map((node) => node.path);
  assert.equal(forestPaths.includes(path.join(bCheckout, "AGENTS.md")), true);
  assert.equal(forestPaths.includes(path.join(nested, "AGENTS.md")), false);
  const cli = await run(["forest", "list", "--no-super"], { env });
  const trees = (JSON.parse(cli.stdout) as { trees: Array<{ root: string }> }).trees.map((tree) => tree.root);
  assert.deepEqual(trees, ["AGENTS.md"]);

  // compose list only shows A's own entry, never B's.
  const listed = JSON.parse((await run(["compose", "list"], { env })).stdout) as { entries: Array<{ name: string }> };
  assert.deepEqual(listed.entries.map((entry) => entry.name), ["b"]);
});

test("compose pull without a scope AGENTS.md still fails the whole command", async (t) => {
  const root = mkdtempSync(path.join(tmpdir(), "compose-noscope-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const result = await run(["compose", "pull"], { env: { ...process.env, EDGES_SCOPE: root } });
  assert.notEqual(result.exitCode, 0);
  assert.equal(failed(result.stdout).status, "failed");
  assert.doesNotMatch(result.stdout, /"entries"/);
});

test("compose pull --help documents per-entry failure handling", async () => {
  const result = await run(["compose", "pull", "--help"]);
  assert.equal(result.exitCode, 0);
  assert.match(result.stdout, /action "failed"/);
  assert.match(result.stdout, /every requested entry/);
});
