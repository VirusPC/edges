import { randomBytes } from "node:crypto";
import path from "node:path";
import {
  EdgesConfigError,
  assertUnifiedConfigPath,
  configHome,
  defaultEdgesConfigPath,
  edgesConfigMigrationMessage,
  parseEnvFile,
  readEdgesEnv,
  upsertEnvAssignments,
} from "../../config/edges-env.js";
import { ArtifactsError } from "../error.js";

export { configHome, parseEnvFile };

export const PLACEHOLDER_TOKEN = "replace-with-shared-token";
export const DEFAULT_PUBLIC_BASE_URL = "https://edges.viruspc.tech";
export const DEFAULT_HOST = "127.0.0.1";
export const DEFAULT_PORT = 8787;
export const UNIT_NAME = "edges-artifacts-preview.service";

export type ServerEnv = {
  token: string;
  baseUrl: string;
  host: string;
  port: number;
  dataDir: string;
  configPath: string;
};

export function defaultServerConfigPath(env: NodeJS.ProcessEnv = process.env): string {
  return defaultEdgesConfigPath(env);
}

export function defaultDataDir(env: NodeJS.ProcessEnv = process.env): string {
  const home = env.HOME || env.USERPROFILE || "";
  return path.join(home, ".local", "share", "edges-artifacts");
}

function configError(error: unknown): never {
  if (error instanceof EdgesConfigError) {
    throw new ArtifactsError("VALIDATION_ERROR", error.message);
  }
  if (error instanceof ArtifactsError) {
    throw error;
  }
  throw error;
}

export async function loadServerEnv(
  env: NodeJS.ProcessEnv,
  configPath?: string,
): Promise<Partial<ServerEnv> & { configPath: string; raw?: Record<string, string> }> {
  const resolved = configPath?.trim() || defaultServerConfigPath(env);
  try {
    assertUnifiedConfigPath(env, resolved);
  } catch (error) {
    configError(error);
  }
  let file: Record<string, string>;
  try {
    file = (await readEdgesEnv(env, resolved)).values;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (error instanceof EdgesConfigError) {
      throw new ArtifactsError("VALIDATION_ERROR", error.message);
    }
    if (code === "ENOENT") {
      throw new ArtifactsError("VALIDATION_ERROR", edgesConfigMigrationMessage(env, resolved));
    }
    throw error;
  }
  const portRaw = file.EDGES_ARTIFACTS_PORT;
  const port = portRaw ? Number(portRaw) : undefined;
  return {
    configPath: resolved,
    token: file.EDGES_ARTIFACTS_TOKEN,
    baseUrl: stripSlash(file.EDGES_ARTIFACTS_BASE_URL),
    host: file.EDGES_ARTIFACTS_HOST,
    port: port !== undefined && Number.isInteger(port) ? port : undefined,
    dataDir: file.EDGES_ARTIFACTS_DATA_DIR,
    raw: file,
  };
}

export type EnsureServerEnvOptions = {
  env: NodeJS.ProcessEnv;
  configPath?: string;
  force?: boolean;
  baseUrl?: string;
  host?: string;
  port?: number;
  dataDir?: string;
  token?: string;
};

export type EnsuredServerEnv = ServerEnv & {
  tokenCreated: boolean;
  tokenRotated: boolean;
};

export async function ensureServerEnv(options: EnsureServerEnvOptions): Promise<EnsuredServerEnv> {
  const configPath = options.configPath?.trim() || defaultServerConfigPath(options.env);
  let existing: Awaited<ReturnType<typeof loadServerEnv>>;
  try {
    existing = await loadServerEnv(options.env, configPath);
  } catch (error) {
    configError(error);
  }
  const hasToken = Boolean(existing.token && existing.token !== PLACEHOLDER_TOKEN);
  if (hasToken && !options.force) {
    return {
      configPath,
      token: existing.token as string,
      baseUrl: existing.baseUrl || DEFAULT_PUBLIC_BASE_URL,
      host: existing.host || DEFAULT_HOST,
      port: existing.port ?? DEFAULT_PORT,
      dataDir: existing.dataDir || defaultDataDir(options.env),
      tokenCreated: false,
      tokenRotated: false,
    };
  }
  const values: ServerEnv = {
    token: options.token?.trim() || randomBytes(32).toString("hex"),
    baseUrl: existing.baseUrl || stripSlash(options.baseUrl) || DEFAULT_PUBLIC_BASE_URL,
    host: existing.host || options.host?.trim() || DEFAULT_HOST,
    port: existing.port ?? options.port ?? DEFAULT_PORT,
    dataDir: existing.dataDir || options.dataDir?.trim() || defaultDataDir(options.env),
    configPath,
  };
  await upsertEnvAssignments(configPath, {
    EDGES_ARTIFACTS_TOKEN: values.token,
    EDGES_ARTIFACTS_BASE_URL: stripSlash(values.baseUrl) ?? values.baseUrl,
    EDGES_ARTIFACTS_HOST: values.host,
    EDGES_ARTIFACTS_PORT: String(values.port),
    EDGES_ARTIFACTS_DATA_DIR: values.dataDir,
  });
  return {
    ...values,
    tokenCreated: !hasToken,
    tokenRotated: hasToken && Boolean(options.force),
  };
}

export function assertUsableToken(token: string | undefined, configPath: string): string {
  if (!token || token === PLACEHOLDER_TOKEN) {
    throw new Error(
      `missing token in ${configPath} — run edges artifacts server install (do not leave ${PLACEHOLDER_TOKEN})`,
    );
  }
  return token;
}

function stripSlash(url: string | undefined): string | undefined {
  if (!url) {
    return undefined;
  }
  return url.replace(/\/$/, "");
}
