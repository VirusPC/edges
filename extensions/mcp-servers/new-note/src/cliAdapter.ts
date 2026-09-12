import { execFile } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import type { IngestRequest, RuntimeConfig, ScriptSuccess } from "./types.js";

const execFileAsync = promisify(execFile);
const MCP_PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

type CliPayload = {
  status: string;
  filePath?: string;
  branch?: string;
  prStatus?: ScriptSuccess["prStatus"];
  prUrl?: string;
  reason?: string;
  errorCode?: string;
};

function spawnArgs(cliEntry: string): { file: string; prefix: string[] } {
  if (cliEntry.endsWith(".ts")) {
    return { file: process.execPath, prefix: ["--import", "tsx", cliEntry] };
  }
  return { file: process.execPath, prefix: [cliEntry] };
}

function failedNoteError(parsed: CliPayload, stdout: string): Error {
  return Object.assign(new Error(parsed.reason || "edges note failed"), {
    errorCode: parsed.errorCode,
    stdout,
  });
}

function parseNoteJson(stdout: string): ScriptSuccess {
  const parsed = JSON.parse(stdout) as CliPayload;
  if (parsed.status !== "success" || !parsed.filePath || !parsed.branch || !parsed.prStatus) {
    throw failedNoteError(parsed, stdout);
  }
  return {
    filePath: parsed.filePath,
    branch: parsed.branch,
    prUrl: parsed.prUrl,
    prStatus: parsed.prStatus,
    stdout,
  };
}

export async function runEdgesNote(
  input: IngestRequest,
  config: RuntimeConfig,
  env: NodeJS.ProcessEnv = process.env,
): Promise<ScriptSuccess> {
  const { file, prefix } = spawnArgs(config.cliEntry);
  const args = [
    ...prefix,
    "note",
    "--title",
    input.title,
    "--content",
    input.content,
    "--co-author",
    input.coAuthor,
    "--json",
    "--mode",
    config.mode,
  ];
  if (config.dryRun || env.EDGES_DRY_RUN === "true") args.push("--dry-run");

  const childEnv: NodeJS.ProcessEnv = {
    ...env,
    EDGES_REPO: config.repoPath,
    EDGES_BASE_BRANCH: config.baseBranch,
    EDGES_MODE: config.mode,
    EDGES_DRY_RUN: config.dryRun ? "true" : env.EDGES_DRY_RUN,
  };
  delete childEnv.EDGES_AUTH_TOKEN;

  let stdout = "";
  try {
    const result = await execFileAsync(file, args, {
      cwd: MCP_PACKAGE_ROOT,
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
