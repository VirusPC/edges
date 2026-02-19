import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { IngestRequest, RuntimeConfig, ScriptSuccess } from "./types.js";

const execFileAsync = promisify(execFile);

const FILE_MARKER = "__EDGES_FILE__=";
const BRANCH_MARKER = "__EDGES_BRANCH__=";
const PR_URL_MARKER = "__EDGES_PR_URL__=";
const PR_STATUS_MARKER = "__EDGES_PR_STATUS__=";

function pickMarkerValue(stdout: string, marker: string): string | undefined {
  const line = stdout
    .split("\n")
    .map((s) => s.trim())
    .find((s) => s.startsWith(marker));
  return line?.slice(marker.length).trim();
}

export async function runIngestScript(input: IngestRequest, config: RuntimeConfig): Promise<ScriptSuccess> {
  const envVars: Record<string, string | undefined> = {
    ...process.env,
    EDGES_REPO: config.repoPath,
    EDGES_BASE_BRANCH: config.baseBranch,
    EDGES_MODE: config.mode,
  };

  const { stdout } = await execFileAsync(config.scriptPath, [input.title, input.content, input.coAuthor], {
    env: envVars,
    maxBuffer: 1024 * 1024 * 10,
  });

  const filePath = pickMarkerValue(stdout, FILE_MARKER);
  const branch = pickMarkerValue(stdout, BRANCH_MARKER);
  const prUrl = pickMarkerValue(stdout, PR_URL_MARKER);
  const prStatusMarker = pickMarkerValue(stdout, PR_STATUS_MARKER);

  if (!filePath || !branch) {
    throw new Error("Missing marker output from ingest script");
  }

  let prStatus: "created" | "unavailable" | "direct_commit" = "unavailable";
  if (prStatusMarker === "created") prStatus = "created";
  if (prStatusMarker === "direct_commit") prStatus = "direct_commit";

  return {
    filePath,
    branch,
    prUrl,
    prStatus,
    stdout,
  };
}
