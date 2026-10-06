import { resolveScope, gitRoot } from "./scope.js";

export interface RuntimeConfig {
  repoPath: string;
  scopeDir: string;
  baseBranch: string;
  mode: "pr" | "direct";
  dryRun: boolean;
  authToken?: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  const scopeDir = resolveScope(env);
  const repoPath = gitRoot(scopeDir) ?? scopeDir;
  const rawMode = env.EDGES_MODE?.toLowerCase();
  const mode = rawMode === "pr" ? "pr" : "direct";
  const authToken = env.EDGES_AUTH_TOKEN?.trim() || undefined;

  return {
    repoPath,
    scopeDir,
    baseBranch: env.EDGES_BASE_BRANCH ?? "main",
    mode,
    dryRun: env.EDGES_DRY_RUN === "true",
    authToken,
  };
}
