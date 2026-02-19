import path from "node:path";
import { fileURLToPath } from "node:url";
import type { RuntimeConfig } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveDefaultRepoPath(): string {
  return path.resolve(__dirname, "../../../../");
}

export function loadConfig(): RuntimeConfig {
  const repoPath = process.env.EDGES_REPO ?? resolveDefaultRepoPath();
  const rawMode = process.env.EDGES_MODE?.toLowerCase();
  const mode = rawMode === "direct" ? "direct" : "pr";
  
  return {
    repoPath,
    baseBranch: process.env.EDGES_BASE_BRANCH ?? "main",
    scriptPath: path.join(repoPath, "bin/new-note"),
    mode,
    authToken: process.env.EDGES_AUTH_TOKEN,
  };
}