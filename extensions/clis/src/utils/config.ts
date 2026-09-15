import path from "node:path";
import { fileURLToPath } from "node:url";

export interface RuntimeConfig {
  repoPath: string;
  baseBranch: string;
  mode: "pr" | "direct";
  dryRun: boolean;
  authToken?: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveEdgesRoot(): string {
  return path.resolve(__dirname, "../../../..");
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  const edgesRoot = resolveEdgesRoot();
  const repoPath = env.EDGES_REPO ?? edgesRoot;
  const rawMode = env.EDGES_MODE?.toLowerCase();
  const mode = rawMode === "pr" ? "pr" : "direct";
  const authToken = env.EDGES_AUTH_TOKEN?.trim() || undefined;

  return {
    repoPath,
    baseBranch: env.EDGES_BASE_BRANCH ?? "main",
    mode,
    dryRun: env.EDGES_DRY_RUN === "true",
    authToken,
  };
}
