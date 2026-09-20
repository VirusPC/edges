import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const PLACEHOLDER_TOKEN = "replace-with-shared-token";
export const DEFAULT_PUBLIC_BASE_URL = "http://182.92.131.89";
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

export function configHome(env: NodeJS.ProcessEnv): string {
  if (env.XDG_CONFIG_HOME?.trim()) {
    return env.XDG_CONFIG_HOME.trim();
  }
  const home = env.HOME || env.USERPROFILE || "";
  return path.join(home, ".config");
}

export function defaultServerConfigPath(env: NodeJS.ProcessEnv = process.env): string {
  if (env.EDGES_ARTIFACTS_SERVER_CONFIG?.trim()) {
    return env.EDGES_ARTIFACTS_SERVER_CONFIG.trim();
  }
  return path.join(configHome(env), "edges", "artifacts-preview.env");
}

export function defaultDataDir(env: NodeJS.ProcessEnv = process.env): string {
  const home = env.HOME || env.USERPROFILE || "";
  return path.join(home, ".local", "share", "edges-artifacts");
}

export function parseEnvFile(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq <= 0) {
      continue;
    }
    out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return out;
}

export async function loadServerEnv(
  env: NodeJS.ProcessEnv,
  configPath?: string,
): Promise<Partial<ServerEnv> & { configPath: string; raw?: Record<string, string> }> {
  const resolved = configPath?.trim() || defaultServerConfigPath(env);
  let file: Record<string, string> = {};
  try {
    file = parseEnvFile(await readFile(resolved, "utf8"));
  } catch {
    file = {};
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

export async function writeServerEnv(values: ServerEnv): Promise<void> {
  await mkdir(path.dirname(values.configPath), { recursive: true });
  const body = [
    `EDGES_ARTIFACTS_TOKEN=${values.token}`,
    `EDGES_ARTIFACTS_BASE_URL=${stripSlash(values.baseUrl) ?? values.baseUrl}`,
    `EDGES_ARTIFACTS_HOST=${values.host}`,
    `EDGES_ARTIFACTS_PORT=${values.port}`,
    `EDGES_ARTIFACTS_DATA_DIR=${values.dataDir}`,
    "",
  ].join("\n");
  await writeFile(values.configPath, body, { encoding: "utf8", mode: 0o600 });
  await chmod(values.configPath, 0o600);
}

export function assertUsableToken(token: string | undefined, configPath: string): string {
  if (!token || token === PLACEHOLDER_TOKEN) {
    throw new Error(
      `missing ${configPath} — run edges artifacts server init (do not leave ${PLACEHOLDER_TOKEN})`,
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
