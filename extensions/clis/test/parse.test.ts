import test from "node:test";
import assert from "node:assert/strict";
import { run } from "../src/program.js";
import type { IngestRequest, RuntimeConfig, ScriptSuccess } from "../src/note/utils/types.js";

const requiredNoteFlags = [
  "--title",
  "Daily summary",
  "--content",
  "Some useful content",
  "--co-author",
  "OpenAI Codex <codex@openai.com>",
] as const;

function successIngest() {
  return async (): Promise<ScriptSuccess> => ({
    filePath: "knowledge/notes/2026-09-07--title.md",
    branch: "main",
    prStatus: "direct_commit",
    stdout: "ok\n",
  });
}

function failedJson(stdout: string): { status: string; errorCode: string; reason: string } {
  return JSON.parse(stdout) as { status: string; errorCode: string; reason: string };
}

test("run accepts valid note flags", async () => {
  const result = await run(["note", ...requiredNoteFlags, "--json"], {
    env: { EDGES_AUTH_TOKEN: "" },
    ingest: successIngest(),
  });
  assert.equal(result.exitCode, 0);
  const body = JSON.parse(result.stdout) as { status: string };
  assert.equal(body.status, "success");
});

test("run note rejects missing required flags", async () => {
  const result = await run(["note", "--title", "Daily summary"]);
  assert.equal(result.exitCode, 2);
  const parsed = failedJson(result.stdout);
  assert.equal(parsed.errorCode, "VALIDATION_ERROR");
  assert.match(parsed.reason, /--content/);
  assert.match(parsed.reason, /--co-author/);
});

test("run note rejects unknown flags", async () => {
  const result = await run(["note", ...requiredNoteFlags, "--nope"]);
  assert.equal(result.exitCode, 2);
  assert.equal(failedJson(result.stdout).errorCode, "VALIDATION_ERROR");
});

test("run --help is help", async () => {
  const result = await run(["--help"]);
  assert.equal(result.exitCode, 0);
  assert.match(result.stdout, /Commands:/);
});

test("run note --help is help, not a validation error", async () => {
  const result = await run(["note", "--help"]);
  assert.equal(result.exitCode, 0);
  assert.match(result.stdout, /--title/);
});

test("run tasks --help is help", async () => {
  const result = await run(["tasks", "--help"]);
  assert.equal(result.exitCode, 0);
  assert.match(result.stdout, /\blist\b/);
});

test("run tasks without a subcommand is a validation error", async () => {
  const result = await run(["tasks"]);
  assert.equal(result.exitCode, 2);
  assert.equal(failedJson(result.stdout).errorCode, "VALIDATION_ERROR");
});

test("run rejects unexpected positionals on note", async () => {
  const result = await run(["note", ...requiredNoteFlags, "leftover"]);
  assert.equal(result.exitCode, 2);
  assert.equal(failedJson(result.stdout).errorCode, "VALIDATION_ERROR");
});

test("run note rejects --token-file together with --token-stdin", async () => {
  const result = await run([
    "note",
    ...requiredNoteFlags,
    "--token-file",
    "/tmp/token",
    "--token-stdin",
  ]);
  assert.equal(result.exitCode, 2);
  const parsed = failedJson(result.stdout);
  assert.equal(parsed.errorCode, "VALIDATION_ERROR");
  assert.match(parsed.reason, /token-file|token-stdin/);
});

test("run note rejects invalid --mode", async () => {
  const result = await run(["note", ...requiredNoteFlags, "--mode", "merge"]);
  assert.equal(result.exitCode, 2);
  const parsed = failedJson(result.stdout);
  assert.equal(parsed.errorCode, "VALIDATION_ERROR");
  assert.match(parsed.reason, /mode/);
});

test("run returns version", async () => {
  const version = await run(["--version"]);
  assert.equal(version.exitCode, 0);
  assert.match(version.stdout, /\d+\.\d+\.\d+/);
  const short = await run(["-v"]);
  assert.equal(short.exitCode, 0);
  assert.match(short.stdout, /\d+\.\d+\.\d+/);
});

test("run root without a subcommand is not note ingest", async () => {
  let called = false;
  const result = await run([], {
    ingest: async (_input: IngestRequest, _config: RuntimeConfig): Promise<ScriptSuccess> => {
      called = true;
      throw new Error("ingest should not run");
    },
  });
  assert.equal(called, false);
  assert.notEqual(result.exitCode, 0);
});

test("run rejects the removed ingest subcommand name", async () => {
  const result = await run(["ingest", ...requiredNoteFlags]);
  assert.equal(result.exitCode, 2);
  const parsed = failedJson(result.stdout);
  assert.equal(parsed.errorCode, "VALIDATION_ERROR");
  assert.match(parsed.reason, /edges note/);
});

test("run rejects old root-as-ingest flat flags", async () => {
  const result = await run([...requiredNoteFlags, "--json"]);
  assert.equal(result.exitCode, 2);
  assert.equal(failedJson(result.stdout).errorCode, "VALIDATION_ERROR");
});
