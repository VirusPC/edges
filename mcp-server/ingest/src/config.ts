import path from "node:path";
import { fileURLToPath } from "node:url";
import type { RuntimeConfig } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveDefaultRepoPath(): string {
  return path.resolve(__dirname, "../../../");
}

function resolveDefaultScriptPath(): string {
  return path.resolve(__dirname, "../../../bin/new-note");
}

export function loadConfig(): RuntimeConfig {
  return {
    repoPath: process.env.EDGES_REPO_PATH ?? resolveDefaultRepoPath(),
    baseBranch: process.env.EDGES_BASE_BRANCH ?? "main",
    scriptPath: process.env.EDGES_NEW_NOTE_SCRIPT ?? process.env.EDGES_INGEST_SCRIPT ?? resolveDefaultScriptPath(),
  };
}
