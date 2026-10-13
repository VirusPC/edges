import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { RuntimeConfig } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function resolveImplementationRoot(): string {
  return path.resolve(__dirname, "../../../../");
}

function resolveCliEntry(env: NodeJS.ProcessEnv): string {
  if (env.EDGES_CLI) return path.resolve(env.EDGES_CLI);
  const dist = path.resolve(__dirname, "../../../cli/dist/index.js");
  const src = path.resolve(__dirname, "../../../cli/src/index.ts");
  return fs.existsSync(dist) ? dist : src;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  const repoPath = env.EDGES_REPO?.trim() ? path.resolve(env.EDGES_REPO) : undefined;
  const rawMode = env.EDGES_MODE?.toLowerCase();
  return {
    repoPath,
    scopeDir: env.EDGES_SCOPE?.trim() ? path.resolve(env.EDGES_SCOPE) : undefined,
    cwd: process.cwd(),
    baseBranch: env.EDGES_BASE_BRANCH ?? "main",
    cliEntry: resolveCliEntry(env),
    skillsPath: path.join(resolveImplementationRoot(), "extensions/skills"),
    mode: rawMode === "pr" ? "pr" : "direct",
    dryRun: env.EDGES_DRY_RUN === "true",
    authToken: env.EDGES_AUTH_TOKEN,
  };
}
