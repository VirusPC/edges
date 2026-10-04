import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
function fixture(t: any) { const root = mkdtempSync(path.join(tmpdir(), 'note-ingest-')); t.after(() => rmSync(root, { recursive: true, force: true })); return root; }
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
    if (file === "git" && args[0] === "--version") return { stdout: "git version 2.0", stderr: "" };
    return { stdout: "", stderr: "" };
  };
}

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

  assert.equal(result.filePath, "knowledge/notes/2026-09-11--hello-world.md");
  assert.equal(result.branch, "main");
  assert.equal(result.prStatus, "direct_commit");
  assert.match(result.stdout, /__EDGES_PR_STATUS__=direct_commit/);
  assert.equal(
    readFileSync(path.join(repo, "knowledge/notes/2026-09-11--hello-world.md"), "utf8"),
    "# Hello World\n\n> Ingested on 2026-09-11\n\nBody text\n",
  );

  const gitCommands = calls.filter((c) => c[0] === "git").map((c) => c.slice(1));
  assert.ok(gitCommands.some((a) => a[0] === "add"));
  assert.ok(
    gitCommands.some(
      (a) => a[0] === "commit" && a.includes("-m") && a.some((x) => x.startsWith("ingest: Hello World")),
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
  const gitCommands = calls.filter((c) => c[0] === "git").map((c) => c.slice(1));
  assert.ok(gitCommands.some((a) => a[0] === "checkout" && a[1] === "-b" && a[2] === "ingest/2026-09-11-hello-world"));
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
        if (file === "git" && args[0] === "--version") return { stdout: "git version 2.0", stderr: "" };
        if (file === "git" && args[0] === "remote") {
          return { stdout: "https://github.com/VirusPC/edges.git\n", stderr: "" };
        }
        if (file === "gh" && args[0] === "auth") return { stdout: "ok", stderr: "" };
        if (file === "gh" && args[0] === "pr") {
          return { stdout: "https://github.com/VirusPC/edges/pull/9\n", stderr: "" };
        }
        return { stdout: "", stderr: "" };
      },
      now,
    },
  );

  assert.equal(result.prStatus, "created");
  assert.equal(result.prUrl, "https://github.com/VirusPC/edges/pull/9");
  const git = calls.filter((c) => c.file === "git");
  assert.ok(git.some((c) => c.args[0] === "checkout" && c.args[1] === "main" && c.cwd === repo));
  assert.ok(git.some((c) => c.args[0] === "pull" && c.cwd === repo));
  assert.ok(git.some((c) => c.args[0] === "push" && c.args.includes("-u") && c.cwd === repo));
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
  assert.equal(message, "ingest: Hello World\n\nCo-authored-by: Tester <tester@example.com>\n");
});

test('nested Note targets content scope while committing relative to actual Git root', async () => {
  const { mkdtemp, mkdir, readFile, rm } = await import('node:fs/promises');
  const { execFileSync } = await import('node:child_process');
  const { tmpdir } = await import('node:os');
  const path = await import('node:path');
  const root = await mkdtemp(path.join(tmpdir(), 'edges-note-scope-'));
  try {
    execFileSync('git', ['init', '-q', root]);
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: root });
    execFileSync('git', ['config', 'user.name', 'Test'], { cwd: root });
    const child = path.join(root, 'projects/child');
    await mkdir(child, { recursive: true });
    const result = await runNoteIngest(input, { repoPath: root, scopeDir: child, baseBranch: 'main', mode: 'direct', dryRun: true }, process.env, { now });
    assert.equal(result.filePath, 'projects/child/knowledge/notes/2026-09-11--hello-world.md');
    assert.match(await readFile(path.join(root, result.filePath), 'utf8'), /Body text/);
    assert.equal(execFileSync('git', ['show', '--format=', '--name-only', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), result.filePath);
  } finally { await rm(root, { recursive: true, force: true }); }
});
