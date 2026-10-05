import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
function fixture(t: any) {
  const root = mkdtempSync(path.join(tmpdir(), "note-ingest-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}
import test from "node:test";
import assert from "node:assert/strict";
import { runNoteIngest } from "../../../src/services/note/git/ingest.js";
import type { ExecFn } from "../../../src/services/note/git/exec.js";

const input = {
  title: "Hello World",
  content: "Body text",
  coAuthor: "Tester <tester@example.com>",
};

const now = new Date("2026-09-11T12:00:00+00:00");

function recordingExec(calls: string[][]): ExecFn {
  return async (file, args) => {
    calls.push([file, ...args]);
    if (file === "git" && args[0] === "--version")
      return { stdout: "git version 2.0", stderr: "" };
    return { stdout: "", stderr: "" };
  };
}

function refreshDirectoryOnPull(repo: string, calls: string[][]): ExecFn {
  const directory = path.join(repo, "notes/2026-09-11--hello-world");
  return async (file, args) => {
    calls.push([file, ...args]);
    if (file === "git" && args[0] === "pull") {
      mkdirSync(directory, { recursive: true });
      writeFileSync(path.join(directory, "index.md"), "# Base branch note\n");
    }
    return {
      stdout:
        file === "git" && args[0] === "--version" ? "git version 2.0" : "",
      stderr: "",
    };
  };
}

test("uses the directory note that appears during Git refresh when format is implicit", async (t) => {
  const repo = fixture(t);
  const calls: string[][] = [];
  const result = await runNoteIngest(
    input,
    { repoPath: repo, baseBranch: "main", mode: "direct", dryRun: false },
    {},
    {
      exec: refreshDirectoryOnPull(repo, calls),
      now,
    },
  );

  assert.equal(
    result.filePath,
    "notes/2026-09-11--hello-world/index.md",
  );
  assert.equal(
    readFileSync(path.join(repo, result.filePath), "utf8"),
    "# Hello World\n\n> Ingested on 2026-09-11\n\nBody text\n",
  );
  assert.equal(
    existsSync(path.join(repo, "notes/2026-09-11--hello-world.md")),
    false,
  );
  assert.ok(
    calls.some(
      (call) =>
        call[1] === "add" &&
        call[2] === "notes/2026-09-11--hello-world/index.md",
    ),
  );
});

test("rejects whole-directory import when Git refresh supplies the directory note", async (t) => {
  const repo = fixture(t);
  const resources = realpathSync(fixture(t));
  writeFileSync(path.join(resources, "asset.txt"), "asset bytes");
  writeFileSync(path.join(resources, "index.md"), "# Imported");
  const calls: string[][] = [];
  await assert.rejects(
    () =>
      runNoteIngest(
        { ...input, importEntry: path.join(resources, "index.md") },
        { repoPath: repo, baseBranch: "main", mode: "direct", dryRun: false },
        {},
        { exec: refreshDirectoryOnPull(repo, calls), now },
      ),
    /destination already exists/,
  );

  const directory = path.join(repo, "notes/2026-09-11--hello-world");
  assert.equal(
    readFileSync(path.join(directory, "index.md"), "utf8"),
    "# Base branch note\n",
  );
  assert.equal(existsSync(path.join(directory, "asset.txt")), false);
  assert.equal(
    calls.some((call) => ["add", "commit", "push"].includes(call[1])),
    false,
  );
});

test("dry-run direct writes the note, commits, skips checkout/pull/push", async (t) => {
  const repo = fixture(t);
  const calls: string[][] = [];
  const result = await runNoteIngest(
    input,
    { repoPath: repo, baseBranch: "main", mode: "direct", dryRun: true },
    { GITHUB_TOKEN: "" },
    {
      exec: recordingExec(calls),
      now,
    },
  );

  assert.equal(
    result.filePath,
    "notes/2026-09-11--hello-world/index.md",
  );
  assert.equal(result.branch, "main");
  assert.equal(result.prStatus, "direct_commit");
  assert.match(result.stdout, /__EDGES_PR_STATUS__=direct_commit/);
  assert.equal(
    readFileSync(
      path.join(repo, "notes/2026-09-11--hello-world/index.md"),
      "utf8",
    ),
    "# Hello World\n\n> Ingested on 2026-09-11\n\nBody text\n",
  );

  const gitCommands = calls
    .filter((c) => c[0] === "git")
    .map((c) => c.slice(1));
  assert.ok(gitCommands.some((a) => a[0] === "add"));
  assert.ok(
    gitCommands.some(
      (a) =>
        a[0] === "commit" &&
        a.includes("-m") &&
        a.some((x) => x.startsWith("ingest: Hello World")),
    ),
  );
  assert.ok(!gitCommands.some((a) => a[0] === "checkout"));
  assert.ok(!gitCommands.some((a) => a[0] === "pull"));
  assert.ok(!gitCommands.some((a) => a[0] === "push"));
});

test("dry-run pr creates local branch and does not push", async (t) => {
  const repo = fixture(t);
  const calls: string[][] = [];
  const result = await runNoteIngest(
    input,
    { repoPath: repo, baseBranch: "main", mode: "pr", dryRun: true },
    {},
    {
      exec: recordingExec(calls),
      now,
    },
  );

  assert.equal(result.branch, "ingest/2026-09-11-hello-world");
  assert.equal(result.prStatus, "unavailable");
  assert.match(result.stdout, /__EDGES_PR_STATUS__=unavailable/);
  const gitCommands = calls
    .filter((c) => c[0] === "git")
    .map((c) => c.slice(1));
  assert.ok(
    gitCommands.some(
      (a) =>
        a[0] === "checkout" &&
        a[1] === "-b" &&
        a[2] === "ingest/2026-09-11-hello-world",
    ),
  );
  assert.ok(!gitCommands.some((a) => a[0] === "pull"));
  assert.ok(!gitCommands.some((a) => a[0] === "push"));
});

test("pr mode runs gh in the target repo cwd after checkout pull and push", async (t) => {
  const repo = fixture(t);
  const calls: Array<{ file: string; args: string[]; cwd?: string }> = [];
  const result = await runNoteIngest(
    input,
    { repoPath: repo, baseBranch: "main", mode: "pr", dryRun: false },
    {},
    {
      exec: async (file, args, options) => {
        calls.push({ file, args, cwd: options?.cwd });
        if (file === "git" && args[0] === "--version")
          return { stdout: "git version 2.0", stderr: "" };
        if (file === "git" && args[0] === "remote") {
          return {
            stdout: "https://github.com/VirusPC/edges.git\n",
            stderr: "",
          };
        }
        if (file === "gh" && args[0] === "auth")
          return { stdout: "ok", stderr: "" };
        if (file === "gh" && args[0] === "pr") {
          return {
            stdout: "https://github.com/VirusPC/edges/pull/9\n",
            stderr: "",
          };
        }
        return { stdout: "", stderr: "" };
      },
      now,
    },
  );

  assert.equal(result.prStatus, "created");
  assert.equal(result.prUrl, "https://github.com/VirusPC/edges/pull/9");
  const git = calls.filter((c) => c.file === "git");
  assert.ok(
    git.some(
      (c) => c.args[0] === "checkout" && c.args[1] === "main" && c.cwd === repo,
    ),
  );
  assert.ok(git.some((c) => c.args[0] === "pull" && c.cwd === repo));
  assert.ok(
    git.some(
      (c) => c.args[0] === "push" && c.args.includes("-u") && c.cwd === repo,
    ),
  );
  const ghPr = calls.find((c) => c.file === "gh" && c.args[0] === "pr");
  assert.ok(ghPr);
  assert.equal(ghPr.cwd, repo);
});

test("commit message includes Co-authored-by trailer", async (t) => {
  const repo = fixture(t);
  const calls: string[][] = [];
  await runNoteIngest(
    input,
    { repoPath: repo, baseBranch: "main", mode: "direct", dryRun: true },
    {},
    {
      exec: recordingExec(calls),
      now,
    },
  );
  const commit = calls.find((c) => c[0] === "git" && c[1] === "commit");
  assert.ok(commit);
  const message = commit[commit.indexOf("-m") + 1];
  assert.equal(
    message,
    "ingest: Hello World\n\nCo-authored-by: Tester <tester@example.com>\n",
  );
});

test("nested Note targets content scope while committing relative to actual Git root", async () => {
  const { mkdtemp, mkdir, readFile, rm } = await import("node:fs/promises");
  const { execFileSync } = await import("node:child_process");
  const { tmpdir } = await import("node:os");
  const path = await import("node:path");
  const root = await mkdtemp(path.join(tmpdir(), "edges-note-scope-"));
  try {
    execFileSync("git", ["init", "-q", root]);
    execFileSync("git", ["config", "user.email", "test@example.com"], {
      cwd: root,
    });
    execFileSync("git", ["config", "user.name", "Test"], { cwd: root });
    const child = path.join(root, "projects/child");
    await mkdir(child, { recursive: true });
    const result = await runNoteIngest(
      input,
      {
        repoPath: root,
        scopeDir: child,
        baseBranch: "main",
        mode: "direct",
        dryRun: true,
      },
      process.env,
      { now },
    );
    assert.equal(
      result.filePath,
      "projects/child/notes/2026-09-11--hello-world/index.md",
    );
    assert.match(
      await readFile(path.join(root, result.filePath), "utf8"),
      /Body text/,
    );
    assert.equal(
      execFileSync("git", ["show", "--format=", "--name-only", "HEAD"], {
        cwd: root,
        encoding: "utf8",
      }).trim(),
      result.filePath,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("document update commits only entry and leaves unrelated siblings unstaged", async (t) => {
  const repo = fixture(t);
  const git = (...args: string[]) =>
    execFileSync("git", args, { cwd: repo, encoding: "utf8" });
  git("init", "-q");
  git("config", "user.name", "Tester");
  git("config", "user.email", "test@example.com");
  const config = {
    repoPath: repo,
    baseBranch: "main",
    mode: "direct" as const,
    dryRun: true,
  };
  const first = await runNoteIngest(input, config, {}, { now });
  const attachment = path.join(path.dirname(first.filePath), "attachment.txt");
  const unrelated = path.join(path.dirname(first.filePath), "unrelated.txt");
  writeFileSync(path.join(repo, attachment), "original");
  git("add", attachment);
  git("commit", "-qm", "attachment");
  writeFileSync(path.join(repo, attachment), "modified");
  writeFileSync(path.join(repo, unrelated), "untracked");
  await runNoteIngest(
    { ...input, content: "Updated body" },
    config,
    {},
    { now },
  );
  assert.deepEqual(
    git("diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD")
      .trim()
      .split("\n"),
    [first.filePath],
  );
  assert.equal(git("show", "HEAD:" + attachment), "original");
  assert.match(git("status", "--porcelain"), / M .*attachment.txt/);
  assert.match(git("status", "--porcelain"), /\?\? .*unrelated.txt/);
  assert.equal(git("diff", "--cached", "--name-only"), "");
});

test("nested known Memory import rejects before Git or destination mutation", async (t) => {
  const repo = realpathSync(fixture(t));
  execFileSync("git", ["init", "-q", repo]);
  const sourceRoot = realpathSync(fixture(t));
  const typeDir = path.join(sourceRoot, ".harness/memory/projects");
  const source = path.join(typeDir, "group/project_one/index.md");
  mkdirSync(path.dirname(source), { recursive: true });
  writeFileSync(
    path.join(typeDir, "AGENTS.md"),
    "<!-- project-memory-type:start -->\nname: project\nmodule: memory\nwritable: true\n<!-- project-memory-type:end -->\n",
  );
  writeFileSync(source, "# Source memory\n");
  const { NodeService } = await import("../../../src/services/node-service.js");
  assert.equal(
    (await new NodeService({ managedRoot: sourceRoot }).get(source))?.type,
    "memory",
  );
  const beforeHead = readFileSync(path.join(repo, ".git/HEAD"), "utf8");
  await assert.rejects(
    runNoteIngest(
      { ...input, content: "# Source memory\n", importEntry: source },
      { repoPath: repo, baseBranch: "main", mode: "pr", dryRun: false },
      {},
      { now },
    ),
    /source type memory cannot be imported as note/,
  );
  assert.equal(readFileSync(path.join(repo, ".git/HEAD"), "utf8"), beforeHead);
  assert.equal(existsSync(path.join(repo, "knowledge")), false);
  assert.equal(readFileSync(source, "utf8"), "# Source memory\n");
});

test("unclassified external entry imports with its resources and commits as Note", async (t) => {
  const repo = realpathSync(fixture(t));
  const git = (...args: string[]) =>
    execFileSync("git", args, { cwd: repo, encoding: "utf8" });
  git("init", "-q");
  git("config", "user.name", "Tester");
  git("config", "user.email", "test@example.com");
  const sourceRoot = realpathSync(fixture(t));
  writeFileSync(
    path.join(sourceRoot, "index.md"),
    "# External\n\nImported body\n",
  );
  writeFileSync(path.join(sourceRoot, "asset.txt"), "bytes");
  const result = await runNoteIngest(
    {
      ...input,
      content: "# External\n\nImported body\n",
      importEntry: path.join(sourceRoot, "index.md"),
    },
    { repoPath: repo, baseBranch: "main", mode: "direct", dryRun: true },
    {},
    { now },
  );
  assert.equal(
    readFileSync(path.join(repo, result.filePath), "utf8"),
    "# External\n\nImported body\n",
  );
  assert.equal(
    readFileSync(
      path.join(repo, path.dirname(result.filePath), "asset.txt"),
      "utf8",
    ),
    "bytes",
  );
  assert.match(git("show", "--format=", "--name-only", "HEAD"), /asset.txt/);
});
