import { readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type ArtifactsConfig = {
  token?: string;
  baseUrl?: string;
  configPath: string;
};

export function defaultArtifactsConfigPath(env: NodeJS.ProcessEnv = process.env): string {
  if (env.EDGES_ARTIFACTS_CONFIG?.trim()) {
    return env.EDGES_ARTIFACTS_CONFIG.trim();
  }
  const home = env.HOME || env.USERPROFILE || "";
  return path.join(home, ".config", "edges", "artifacts.env");
}

function parseEnvFile(raw: string): Record<string, string> {
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

export function readArtifactsConfig(env: NodeJS.ProcessEnv, configPath?: string): ArtifactsConfig {
  const resolved = configPath?.trim() || defaultArtifactsConfigPath(env);
  let file: Record<string, string> = {};
  try {
    file = parseEnvFile(readFileSync(resolved, "utf8"));
  } catch {
    file = {};
  }
  return {
    token: env.EDGES_ARTIFACTS_TOKEN?.trim() || file.EDGES_ARTIFACTS_TOKEN || undefined,
    baseUrl: stripTrailingSlash(env.EDGES_ARTIFACTS_BASE_URL?.trim() || file.EDGES_ARTIFACTS_BASE_URL || ""),
    configPath: resolved,
  };
}

export async function loadArtifactsConfig(env: NodeJS.ProcessEnv, configPath?: string): Promise<ArtifactsConfig> {
  const resolved = configPath?.trim() || defaultArtifactsConfigPath(env);
  let file: Record<string, string> = {};
  try {
    file = parseEnvFile(await readFile(resolved, "utf8"));
  } catch {
    file = {};
  }
  return {
    token: env.EDGES_ARTIFACTS_TOKEN?.trim() || file.EDGES_ARTIFACTS_TOKEN || undefined,
    baseUrl: stripTrailingSlash(env.EDGES_ARTIFACTS_BASE_URL?.trim() || file.EDGES_ARTIFACTS_BASE_URL || ""),
    configPath: resolved,
  };
}

export async function writeArtifactsConfig(
  configPath: string,
  values: { token: string; baseUrl: string },
): Promise<void> {
  await mkdir(path.dirname(configPath), { recursive: true });
  const body = [
    `EDGES_ARTIFACTS_TOKEN=${values.token}`,
    `EDGES_ARTIFACTS_BASE_URL=${stripTrailingSlash(values.baseUrl)}`,
    "",
  ].join("\n");
  await writeFile(configPath, body, { encoding: "utf8", mode: 0o600 });
}

function stripTrailingSlash(url: string): string | undefined {
  if (!url) {
    return undefined;
  }
  return url.replace(/\/$/, "");
}
