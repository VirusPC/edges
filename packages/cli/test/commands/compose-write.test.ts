import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { NoteNode } from "../../src/domain/models/index.js";
import { uninitializedComposeWriteError } from "../../src/services/compose/health.js";
import { NodeService } from "../../src/services/node/node-service.js";
import { run } from "../../src/program.js";

function agents(local = "", descendants = ""): string {
  return `# Scope

<!-- project-harness-local:start -->
## 本层系统维护信息

${local}
<!-- project-harness-local:end -->

<!-- project-harness-descendants:start -->
## 下层系统维护信息

${descendants}
<!-- project-harness-descendants:end -->
`;
}

function put(root: string, rel: string, text: string): void {
  const file = path.join(root, rel);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, text);
}

function git(args: string[], cwd: string): string {
  return execFileSync("git", ["-c", "commit.gpgsign=false", "-c", "user.email=edges@example.com", "-c", "user.name=Edges Test", ...args], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
  });
}

function repo(t: test.TestContext, name: string): string {
  const root = realpathSync(mkdtempSync(path.join(tmpdir(), name)));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

function hostWithBrain(root: string, brainRel = ".harness/compose/brain"): { brain: string } {
  const brain = path.join(root, brainRel);
  put(root, "AGENTS.md", agents("- [材料](.harness/README.md) — index"));
  put(root, ".harness/README.md", `# 材料

<!-- project-entries-local:start -->
## 本层内容

- [组合](compose/README.md) — composed
<!-- project-entries-local:end -->
`);
  put(root, ".harness/compose/README.md", `# 组合

<!-- project-harness-compose:start -->
## 组合

- [brain](<${path.posix.join(path.relative(path.join(root, ".harness/compose"), brain).split(path.sep).join("/"), "README.md")}>) — 个人大脑 remote: https://github.com/example/brain.git
<!-- project-harness-compose:end -->
`);
  put(root, "notes/AGENTS.md", agents(""));
  return { brain };
}

test("notes create and update write inside an initialized composed checkout", async (t) => {
  const root = repo(t, "compose-write-");
  const { brain } = hostWithBrain(root);
  put(brain, "AGENTS.md", agents("", "- [notes](notes/AGENTS.md) — notes"));
  put(brain, "notes/AGENTS.md", agents(""));
  put(brain, "README.md", "# Brain\n");
  git(["init"], root);
  git(["add", "."], root);
  git(["commit", "-m", "host"], root);
  git(["init"], brain);
  git(["add", "."], brain);
  git(["commit", "-m", "brain"], brain);
  const hostNotes = readFileSync(path.join(root, "notes/AGENTS.md"), "utf8");
  const head = git(["rev-parse", "HEAD"], brain);

  const created = await run(
    ["--scope", brain, "notes", "create", "--title", "Inside", "--body", "From the composed repo"],
    { env: {} },
  );
  assert.equal(created.exitCode, 0, created.stdout + created.stderr);
  const made = JSON.parse(created.stdout) as { path: string; title: string };
  assert.equal(made.title, "Inside");
  assert.match(made.path, /^notes\/\d{4}-\d{2}-\d{2}--inside\/INDEX\.md$/);
  assert.equal(existsSync(path.join(brain, made.path)), true);
  assert.match(readFileSync(path.join(brain, "notes/AGENTS.md"), "utf8"), /inside\/INDEX\.md/);
  assert.equal(readFileSync(path.join(root, "notes/AGENTS.md"), "utf8"), hostNotes);
  assert.equal(git(["rev-parse", "HEAD"], brain), head);
  assert.match(git(["status", "--porcelain"], brain), /inside/);

  const updated = await run(
    ["--scope", brain, "notes", "update", made.path, "--body", "Rewritten in the checkout"],
    { env: {} },
  );
  assert.equal(updated.exitCode, 0, updated.stdout + updated.stderr);
  assert.match(readFileSync(path.join(brain, made.path), "utf8"), /Rewritten in the checkout/);
  assert.equal(git(["rev-parse", "HEAD"], brain), head);
});

test("writing into an empty composed checkout names the update command", async (t) => {
  const root = repo(t, "compose-empty-");
  const { brain } = hostWithBrain(root);
  mkdirSync(brain);
  const before = readFileSync(path.join(root, ".harness/compose/README.md"), "utf8");
  const hostNotes = readFileSync(path.join(root, "notes/AGENTS.md"), "utf8");
  const created = await run(
    ["--scope", brain, "notes", "create", "--title", "Nope", "--body", "should not land"],
    { env: {} },
  );
  assert.notEqual(created.exitCode, 0);
  const body = JSON.parse(created.stdout) as { status: string; reason: string };
  assert.equal(body.status, "failed");
  assert.match(body.reason, /compose entry brain is not checked out at brain\/README\.md; run edges compose update --name brain/);
  assert.equal(readdirSync(brain).length, 0);
  assert.equal(readFileSync(path.join(root, ".harness/compose/README.md"), "utf8"), before);
  assert.equal(readFileSync(path.join(root, "notes/AGENTS.md"), "utf8"), hostNotes);
});

test("a missing composed README does not block a host note", async (t) => {
  const root = repo(t, "compose-missing-");
  hostWithBrain(root);
  put(root, "AGENTS.md", agents("", "- [notes](notes/AGENTS.md) — notes"));
  put(root, "notes/AGENTS.md", agents(""));
  const created = await run(
    ["--scope", root, "notes", "create", "--title", "Host", "--body", "still works"],
    { env: {} },
  );
  assert.equal(created.exitCode, 0, created.stdout + created.stderr);
  assert.match(created.stderr, /edges compose update --name brain/);
  const made = JSON.parse(created.stdout) as { path: string };
  assert.equal(existsSync(path.join(root, made.path)), true);
  assert.match(readFileSync(path.join(root, "notes/AGENTS.md"), "utf8"), /INDEX\.md/);
});

test("a host NodeService write inside a checkout stays on that repo", async (t) => {
  const root = repo(t, "compose-scope-");
  const { brain } = hostWithBrain(root);
  put(brain, "AGENTS.md", agents("", "- [notes](notes/AGENTS.md) — notes"));
  put(brain, "notes/AGENTS.md", agents(""));
  put(brain, "README.md", "# Brain\n");
  const note = path.join(brain, "notes/example/INDEX.md");
  const service = new NodeService({ managedRoot: root });
  await service.create(new NoteNode(note), { body: "# Example\n" });
  assert.match(readFileSync(path.join(brain, "notes/AGENTS.md"), "utf8"), /example\/INDEX\.md/);
  assert.doesNotMatch(readFileSync(path.join(root, "notes/AGENTS.md"), "utf8"), /example/);
  assert.doesNotMatch(readFileSync(path.join(root, ".harness/README.md"), "utf8"), /example/);
  const loaded = await service.get(note, NoteNode);
  assert.ok(loaded);
  await service.update(loaded, { body: "# Example\n\nEdited\n" });
  assert.match(readFileSync(note, "utf8"), /Edited/);
});

test("uninitialized checkout errors follow the registered name, including a custom path", () => {
  const root = realpathSync(mkdtempSync(path.join(tmpdir(), "compose-custom-")));
  try {
    hostWithBrain(root, "vendor/brain");
    mkdirSync(path.join(root, "vendor/brain"), { recursive: true });
    const message = uninitializedComposeWriteError(path.join(root, "vendor/brain/notes/x/INDEX.md"));
    assert.match(message ?? "", /compose entry brain is not checked out at \.\.\/\.\.\/vendor\/brain\/README\.md; run edges compose update --name brain/);
    assert.equal(uninitializedComposeWriteError(path.join(root, "notes/x/INDEX.md")), undefined);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
