import test from "node:test";
import assert from "node:assert/strict";
import { runNoteIngest } from "../src/git/ingest.js";
import type { ExecFn } from "../src/git/exec.js";

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

test("dry-run direct writes the note, commits, skips checkout/pull/push", async () => {
  const calls: string[][] = [];
  const writes: Record<string, string> = {};
  const result = await runNoteIngest(
    input,
    { repoPath: "/repo", baseBranch: "main", mode: "direct", dryRun: true },
    { GITHUB_TOKEN: "" },
    {
      exec: recordingExec(calls),
      now,
      directoryExists: async () => true,
      mkdirp: async () => undefined,
      writeFile: async (absPath, contents) => {
        writes[absPath] = contents;
      },
    },
  );

  assert.equal(result.filePath, "knowledge/notes/2026-09-11--hello-world.md");
  assert.equal(result.branch, "main");
  assert.equal(result.prStatus, "direct_commit");
  assert.match(result.stdout, /__EDGES_PR_STATUS__=direct_commit/);
  assert.equal(
    writes["/repo/knowledge/notes/2026-09-11--hello-world.md"],
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

test("dry-run pr creates local branch and does not push", async () => {
  const calls: string[][] = [];
  const result = await runNoteIngest(
    input,
    { repoPath: "/repo", baseBranch: "main", mode: "pr", dryRun: true },
    {},
    {
      exec: recordingExec(calls),
      now,
      directoryExists: async () => true,
      mkdirp: async () => undefined,
      writeFile: async () => undefined,
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

test("pr mode runs gh in the target repo cwd after checkout pull and push", async () => {
  const calls: Array<{ file: string; args: string[]; cwd?: string }> = [];
  const result = await runNoteIngest(
    input,
    { repoPath: "/repo", baseBranch: "main", mode: "pr", dryRun: false },
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
      directoryExists: async () => true,
      mkdirp: async () => undefined,
      writeFile: async () => undefined,
    },
  );

  assert.equal(result.prStatus, "created");
  assert.equal(result.prUrl, "https://github.com/VirusPC/edges/pull/9");
  const git = calls.filter((c) => c.file === "git");
  assert.ok(git.some((c) => c.args[0] === "checkout" && c.args[1] === "main" && c.cwd === "/repo"));
  assert.ok(git.some((c) => c.args[0] === "pull" && c.cwd === "/repo"));
  assert.ok(git.some((c) => c.args[0] === "push" && c.args.includes("-u") && c.cwd === "/repo"));
  const ghPr = calls.find((c) => c.file === "gh" && c.args[0] === "pr");
  assert.ok(ghPr);
  assert.equal(ghPr.cwd, "/repo");
});

test("commit message includes Co-authored-by trailer", async () => {
  const calls: string[][] = [];
  await runNoteIngest(
    input,
    { repoPath: "/repo", baseBranch: "main", mode: "direct", dryRun: true },
    {},
    {
      exec: recordingExec(calls),
      now,
      directoryExists: async () => true,
      mkdirp: async () => undefined,
      writeFile: async () => undefined,
    },
  );
  const commit = calls.find((c) => c[0] === "git" && c[1] === "commit");
  assert.ok(commit);
  const message = commit[commit.indexOf("-m") + 1];
  assert.equal(message, "ingest: Hello World\n\nCo-authored-by: Tester <tester@example.com>\n");
});
