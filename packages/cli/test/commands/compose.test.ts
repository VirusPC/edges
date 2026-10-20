import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { run } from "../../src/program.js";

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
    /\[brain\]\(<~\/\.edges\/composed\/brain>\) — 个人大脑：只在记跨项目判断时写入 remote: https:\/\/github\.com\/example\/brain\.git/,
  );
  const body = JSON.parse(registered.stdout) as { description?: string };
  assert.equal(body.description, "个人大脑：只在记跨项目判断时写入");
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

test("compose register, clone, pull, and push use the repo's own git flow", async (t) => {
  const root = mkdtempSync(path.join(tmpdir(), "compose-cli-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const scope = path.join(root, "scope");
  const bare = path.join(root, "remote.git");
  const source = path.join(root, "source");
  const checkout = path.join(root, "brain");
  mkdirSync(scope, { recursive: true });
  writeFileSync(path.join(scope, "AGENTS.md"), agents());
  git(["init", "--bare", "-b", "main", bare]);
  git(["init", "-b", "main", source]);
  commit(source, "init", "README.md", "origin\n");
  git(["remote", "add", "origin", bare], source);
  git(["push", "-u", "origin", "main"], source);

  const env = { ...process.env, EDGES_SCOPE: scope };
  const registered = await run(
    ["compose", "register", "--name", "brain", "--path", checkout, "--remote", bare, "--description", "个人大脑"],
    { env },
  );
  assert.equal(registered.exitCode, 0, registered.stdout + registered.stderr);
  const listed = await run(["compose", "list"], { env });
  assert.equal(listed.exitCode, 0, listed.stdout);
  const listBody = JSON.parse(listed.stdout) as { entries: Array<{ name: string; directory: string; remote: string }> };
  assert.equal(listBody.entries[0]?.name, "brain");
  assert.equal(listBody.entries[0]?.directory, checkout);
  assert.equal(listBody.entries[0]?.remote, bare);

  const cloned = await run(["compose", "clone", "--name", "brain"], { env });
  assert.equal(cloned.exitCode, 0, cloned.stdout + cloned.stderr);
  assert.equal(JSON.parse(cloned.stdout).entries[0].action, "cloned");
  assert.equal(readFileSync(path.join(checkout, "README.md"), "utf8"), "origin\n");
  const again = await run(["compose", "clone", "--name", "brain"], { env });
  assert.equal(again.exitCode, 0, again.stdout + again.stderr);
  assert.equal(JSON.parse(again.stdout).entries[0].action, "present");

  commit(source, "upstream", "NOTE.md", "from-upstream\n");
  git(["push"], source);
  const pulled = await run(["compose", "pull"], { env });
  assert.equal(pulled.exitCode, 0, pulled.stdout + pulled.stderr);
  assert.equal(JSON.parse(pulled.stdout).entries[0].action, "pulled");
  assert.equal(readFileSync(path.join(checkout, "NOTE.md"), "utf8"), "from-upstream\n");

  commit(checkout, "local", "LOCAL.md", "from-checkout\n");
  const pushed = await run(["compose", "push", "--name", "brain"], { env });
  assert.equal(pushed.exitCode, 0, pushed.stdout + pushed.stderr);
  assert.equal(JSON.parse(pushed.stdout).entries[0].action, "pushed");
  const seen = git(["--git-dir", bare, "log", "-1", "--format=%s", "main"]);
  assert.match(seen, /local/);

  const removed = await run(["compose", "unregister", "--name", "brain"], { env });
  assert.equal(removed.exitCode, 0, removed.stdout + removed.stderr);
  assert.equal(JSON.parse(removed.stdout).name, "brain");
  assert.equal(existsSync(path.join(checkout, "README.md")), true);
  const after = JSON.parse((await run(["compose", "list"], { env })).stdout) as {
    entries: unknown[];
  };
  assert.equal(after.entries.length, 0);
  assert.doesNotMatch(readFileSync(path.join(scope, "AGENTS.md"), "utf8"), /\[brain\]/);
  const missing = await run(["compose", "unregister", "--name", "brain"], { env });
  assert.notEqual(missing.exitCode, 0);
  assert.match(missing.stdout, /Compose entry not found: brain/);
});

interface GitEntries {
  status: string;
  errorCode?: string;
  reason?: string;
  entries: Array<{ name: string; action: string; error?: string }>;
}

function setupRemote(root: string, name: string): string {
  const bare = path.join(root, `${name}.git`);
  const source = path.join(root, `${name}-source`);
  git(["init", "--bare", "-b", "main", bare]);
  git(["init", "-b", "main", source]);
  commit(source, "init", "README.md", `${name}\n`);
  git(["remote", "add", "origin", bare], source);
  git(["push", "-u", "origin", "main"], source);
  return bare;
}

async function registerEntry(
  env: NodeJS.ProcessEnv,
  name: string,
  checkout: string,
  remote: string,
): Promise<void> {
  const result = await run(
    ["compose", "register", "--name", name, "--path", checkout, "--remote", remote, "--description", `${name} 仓`],
    { env },
  );
  assert.equal(result.exitCode, 0, result.stdout + result.stderr);
}

test("compose pull/push/clone skip a failing entry, warn, and still exit 0", async (t) => {
  const root = mkdtempSync(path.join(tmpdir(), "compose-partial-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const scope = path.join(root, "scope");
  mkdirSync(scope, { recursive: true });
  writeFileSync(path.join(scope, "AGENTS.md"), agents());
  const env = { ...process.env, EDGES_SCOPE: scope };
  const goodRemote = setupRemote(root, "good");
  const goodCheckout = path.join(root, "good");
  const badCheckout = path.join(root, "bad");
  // "bad" is registered first so a failure there must not stop "good".
  await registerEntry(env, "bad", badCheckout, path.join(root, "missing.git"));
  await registerEntry(env, "good", goodCheckout, goodRemote);

  const cloned = await run(["compose", "clone"], { env });
  assert.equal(cloned.exitCode, 0, cloned.stdout + cloned.stderr);
  const cloneBody = JSON.parse(cloned.stdout) as GitEntries;
  assert.equal(cloneBody.status, "success");
  assert.deepEqual(cloneBody.entries.map((e) => [e.name, e.action]), [["bad", "failed"], ["good", "cloned"]]);
  assert.ok(cloneBody.entries[0]?.error);
  assert.match(cloned.stderr, /^warning: compose clone failed for bad: /m);
  assert.doesNotMatch(cloned.stderr, /for good/);
  assert.equal(existsSync(path.join(goodCheckout, "README.md")), true);

  const pulled = await run(["compose", "pull"], { env });
  assert.equal(pulled.exitCode, 0, pulled.stdout + pulled.stderr);
  const pullBody = JSON.parse(pulled.stdout) as GitEntries;
  assert.equal(pullBody.status, "success");
  assert.deepEqual(pullBody.entries.map((e) => [e.name, e.action]), [["bad", "failed"], ["good", "pulled"]]);
  assert.equal(pullBody.entries[0]?.error, "Compose checkout is missing: bad");
  assert.match(pulled.stderr, /^warning: compose pull failed for bad: Compose checkout is missing: bad$/m);

  commit(goodCheckout, "local", "LOCAL.md", "from-checkout\n");
  const pushed = await run(["compose", "push"], { env });
  assert.equal(pushed.exitCode, 0, pushed.stdout + pushed.stderr);
  const pushBody = JSON.parse(pushed.stdout) as GitEntries;
  assert.deepEqual(pushBody.entries.map((e) => [e.name, e.action]), [["bad", "failed"], ["good", "pushed"]]);
  assert.match(pushed.stderr, /^warning: compose push failed for bad: /m);
  assert.match(git(["--git-dir", goodRemote, "log", "-1", "--format=%s", "main"]), /local/);
});

test("compose pull/push fail when every requested entry fails, including --name", async (t) => {
  const root = mkdtempSync(path.join(tmpdir(), "compose-allfail-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const scope = path.join(root, "scope");
  mkdirSync(scope, { recursive: true });
  writeFileSync(path.join(scope, "AGENTS.md"), agents());
  const env = { ...process.env, EDGES_SCOPE: scope };
  await registerEntry(env, "one", path.join(root, "one"), path.join(root, "one.git"));
  await registerEntry(env, "two", path.join(root, "two"), path.join(root, "two.git"));

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
