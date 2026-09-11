import test from "node:test";
import assert from "node:assert/strict";
import { run } from "../src/run.js";
import type { IngestRequest, RuntimeConfig, ScriptSuccess } from "../src/types.js";

const requiredNoteFlags = [
  "--title",
  "Title",
  "--content",
  "Body",
  "--co-author",
  "OpenAI Codex <codex@openai.com>",
] as const;

type IngestRunner = (
  input: IngestRequest,
  config: RuntimeConfig,
) => Promise<ScriptSuccess>;

function successIngest(): IngestRunner {
  return async (): Promise<ScriptSuccess> => ({
    filePath: "knowledge/notes/2026-09-07--title.md",
    branch: "main",
    prStatus: "direct_commit",
    stdout: "ok\n__EDGES_FILE__=knowledge/notes/2026-09-07--title.md\n",
  });
}

test("run --help lists note and tasks", async () => {
  const result = await run(["--help"]);
  assert.equal(result.exitCode, 0);
  assert.match(result.stdout, /Commands:/);
  assert.match(result.stdout, /^\s+note\b/m);
  assert.match(result.stdout, /^\s+tasks\b/m);
  assert.doesNotMatch(result.stdout, /^\s+ingest\b/m);
});

test("run note --help documents ingest flags and structured output", async () => {
  const result = await run(["note", "--help"]);
  assert.equal(result.exitCode, 0);
  assert.match(result.stdout, /--title/);
  assert.match(result.stdout, /--content/);
  assert.match(result.stdout, /--co-author/);
  assert.match(result.stdout, /--json/);
  assert.match(result.stdout, /STRUCTURED OUTPUT/);
});

test("run tasks --help documents the placeholder", async () => {
  const result = await run(["tasks", "--help"]);
  assert.equal(result.exitCode, 0);
  assert.match(result.stdout, /not implemented/i);
});

test("run tasks without flags exits usage and does not ingest", async () => {
  let called = false;
  const result = await run(["tasks"], {
    ingest: async () => {
      called = true;
      throw new Error("ingest should not run");
    },
  });

  assert.equal(called, false);
  assert.equal(result.exitCode, 2);
  const parsed = JSON.parse(result.stdout) as { status: string; errorCode: string; reason: string };
  assert.equal(parsed.status, "failed");
  assert.equal(parsed.errorCode, "VALIDATION_ERROR");
  assert.match(parsed.reason, /not implemented/i);
});

test("missing note flags fail with JSON error and do not call ingest", async () => {
  let called = false;
  const result = await run(["note", "--title", "Only title"], {
    ingest: async () => {
      called = true;
      throw new Error("ingest should not run");
    },
  });

  assert.equal(called, false);
  assert.equal(result.exitCode, 2);
  const parsed = JSON.parse(result.stdout) as { status: string; errorCode: string };
  assert.equal(parsed.status, "failed");
  assert.equal(parsed.errorCode, "VALIDATION_ERROR");
  assert.match(result.stderr, /edges note --help/);
});

test("root without a subcommand does not run note ingest", async () => {
  let called = false;
  const result = await run([], {
    ingest: async () => {
      called = true;
      throw new Error("ingest should not run");
    },
  });

  assert.equal(called, false);
  assert.notEqual(result.exitCode, 0);
});

test("too-long title is rejected before ingest", async () => {
  let called = false;
  const result = await run(["note", "--title", "x".repeat(121), "--content", "body", "--co-author", "OpenAI Codex <codex@openai.com>"], {
    ingest: async () => {
      called = true;
      throw new Error("ingest should not run");
    },
  });

  assert.equal(called, false);
  assert.equal(result.exitCode, 2);
  const parsed = JSON.parse(result.stdout) as { errorCode: string };
  assert.equal(parsed.errorCode, "VALIDATION_ERROR");
});

test("AUTH_MISSING does not call ingest", async () => {
  let called = false;
  const result = await run(["note", ...requiredNoteFlags], {
    env: { EDGES_AUTH_TOKEN: "secret" },
    ingest: async () => {
      called = true;
      throw new Error("ingest should not run");
    },
  });

  assert.equal(called, false);
  assert.equal(result.exitCode, 4);
  const parsed = JSON.parse(result.stdout) as { errorCode: string };
  assert.equal(parsed.errorCode, "AUTH_MISSING");
});

test("note subcommand runs the ingest pipeline", async () => {
  const result = await run(["note", ...requiredNoteFlags], {
    env: { EDGES_AUTH_TOKEN: "" },
    ingest: successIngest(),
  });

  assert.equal(result.exitCode, 0);
  const parsed = JSON.parse(result.stdout) as { status: string; filePath: string };
  assert.equal(parsed.status, "success");
  assert.equal(parsed.filePath, "knowledge/notes/2026-09-07--title.md");
});

test("injected ingest success is formatted on stdout", async () => {
  const result = await run(["note", ...requiredNoteFlags], {
    env: { EDGES_AUTH_TOKEN: "" },
    ingest: async (_input: IngestRequest, _config: RuntimeConfig): Promise<ScriptSuccess> => ({
      filePath: "knowledge/notes/2026-09-07--title.md",
      branch: "main",
      prStatus: "direct_commit",
      stdout: "ok\n__EDGES_FILE__=knowledge/notes/2026-09-07--title.md\n",
    }),
  });

  assert.equal(result.exitCode, 0);
  const parsed = JSON.parse(result.stdout) as {
    status: string;
    filePath: string;
    branch: string;
    prStatus: string;
  };
  assert.equal(parsed.status, "success");
  assert.equal(parsed.filePath, "knowledge/notes/2026-09-07--title.md");
  assert.equal(parsed.branch, "main");
  assert.equal(parsed.prStatus, "direct_commit");
});
