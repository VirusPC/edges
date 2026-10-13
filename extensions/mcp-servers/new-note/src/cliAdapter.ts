import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import type { IngestRequest, RuntimeConfig, ScriptSuccess } from "./types.js";

const execFileAsync = promisify(execFile);

type CliPayload = {
  status: string;
  path?: string;
  title?: string;
  reason?: string;
  errorCode?: string;
};

function spawnArgs(cliEntry: string): { file: string; prefix: string[] } {
  if (cliEntry.endsWith(".ts")) {
    return { file: process.execPath, prefix: ["--import", import.meta.resolve("tsx"), cliEntry] };
  }
  return { file: process.execPath, prefix: [cliEntry] };
}

function failedNoteError(parsed: CliPayload, stdout: string): Error {
  return Object.assign(new Error(parsed.reason || "edges notes failed"), {
    errorCode: parsed.errorCode,
    stdout,
  });
}

function parseNoteJson(stdout: string): ScriptSuccess {
  const parsed = JSON.parse(stdout) as CliPayload;
  if (parsed.status !== "success" || !parsed.path || !parsed.title) {
    throw failedNoteError(parsed, stdout);
  }
  return {
    path: parsed.path,
    title: parsed.title,
    stdout,
  };
}

export async function runEdgesNote(
  input: IngestRequest,
  config: RuntimeConfig,
  env: NodeJS.ProcessEnv = process.env,
): Promise<ScriptSuccess> {
  const cwd = config.cwd ?? process.cwd();
  const target = config.scopeDir ?? config.repoPath;
  const { file, prefix } = spawnArgs(path.resolve(cwd, config.cliEntry));
  const args = [
    ...prefix,
    "notes",
    "create",
    "--title",
    input.title,
    "--body",
    input.body,
    "--json",
  ];

  const childEnv: NodeJS.ProcessEnv = {
    ...env,
    EDGES_REPO: config.repoPath,
    EDGES_SCOPE: target === undefined ? undefined : path.resolve(cwd, target),
  };
  delete childEnv.EDGES_AUTH_TOKEN;

  let stdout = "";
  try {
    const result = await execFileAsync(file, args, {
      cwd,
      env: childEnv,
      maxBuffer: 1024 * 1024 * 10,
    });
    stdout = String(result.stdout);
  } catch (error) {
    const err = error as NodeJS.ErrnoException & { stdout?: string; stderr?: string };
    stdout = String(err.stdout ?? "");
    if (!stdout.trim()) {
      throw error;
    }
    try {
      return parseNoteJson(stdout);
    } catch (mapped) {
      if (mapped instanceof SyntaxError) {
        throw error;
      }
      throw mapped;
    }
  }

  return parseNoteJson(stdout);
}
