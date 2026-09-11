import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile as execFileCb } from "node:child_process";
import { promisify } from "node:util";

const execFile = promisify(execFileCb);
const here = path.dirname(fileURLToPath(import.meta.url));
const entry = path.resolve(here, "../src/index.ts");

async function launch(args: string[], env: NodeJS.ProcessEnv = process.env) {
  try {
    const result = await execFile(process.execPath, ["--import", "tsx", entry, ...args], {
      env,
      encoding: "utf8",
    });
    return { status: 0, stdout: result.stdout, stderr: result.stderr };
  } catch (error) {
    const err = error as NodeJS.ErrnoException & { stdout?: string; stderr?: string };
    return {
      status: typeof err.code === "number" ? err.code : 1,
      stdout: err.stdout ?? "",
      stderr: err.stderr ?? "",
    };
  }
}

test("real entry --help lists note and tasks", async () => {
  const result = await launch(["--help"]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Commands:/);
  assert.match(result.stdout, /\bnote\b/);
  assert.match(result.stdout, /\btasks\b/);
});

test("real entry note --help documents ingest flags", async () => {
  const result = await launch(["note", "--help"]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /--title/);
  assert.match(result.stdout, /--content/);
  assert.match(result.stdout, /--co-author/);
  assert.match(result.stdout, /--json/);
});

test("real entry note missing flags exits non-zero with JSON error", async () => {
  const result = await launch(["note"]);
  assert.notEqual(result.status, 0);
  const parsed = JSON.parse(result.stdout) as { status: string; errorCode: string };
  assert.equal(parsed.status, "failed");
  assert.equal(parsed.errorCode, "VALIDATION_ERROR");
});

test("real entry tasks --help documents the placeholder", async () => {
  const result = await launch(["tasks", "--help"]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /not implemented/i);
});
