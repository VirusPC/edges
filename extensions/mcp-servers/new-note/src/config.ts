import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { RuntimeConfig } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function resolveDefaultRepoPath(): string {
  return path.resolve(__dirname, "../../../../");
}

function resolveCliEntry(env: NodeJS.ProcessEnv): string {
  if (env.EDGES_CLI) return env.EDGES_CLI;
  const dist = path.resolve(__dirname, "../../../clis/dist/index.js");
  const src = path.resolve(__dirname, "../../../clis/src/index.ts");
  return fs.existsSync(dist) ? dist : src;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  const repoPath = env.EDGES_REPO ?? resolveDefaultRepoPath();
  const rawMode = env.EDGES_MODE?.toLowerCase();
  return {
    repoPath,
    baseBranch: env.EDGES_BASE_BRANCH ?? "main",
    cliEntry: resolveCliEntry(env),
    skillsPath: path.join(repoPath, "extensions/skills"),
    mode: rawMode === "pr" ? "pr" : "direct",
    dryRun: env.EDGES_DRY_RUN === "true",
    authToken: env.EDGES_AUTH_TOKEN,
  };
}
