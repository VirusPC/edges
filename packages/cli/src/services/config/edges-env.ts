import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export class EdgesConfigError extends Error {
  readonly errorCode = "VALIDATION_ERROR" as const;

  constructor(message: string) {
    super(message);
    this.name = "EdgesConfigError";
  }
}

export const EDGES_ENV_TEMPLATE = `# Unified Edges config. One file, keys grouped by prefix.
# edges no longer reads ~/.config/edges/artifacts-preview.env.
# Create or migrate this file with: edges config init
# Show redacted values with: edges config show

# ARTIFACTS_* / EDGES_ARTIFACTS_*
# EDGES_ARTIFACTS_TOKEN=
# EDGES_ARTIFACTS_BASE_URL=https://edges.viruspc.tech
# EDGES_ARTIFACTS_HOST=127.0.0.1
# EDGES_ARTIFACTS_PORT=8787
# EDGES_ARTIFACTS_DATA_DIR=

# EXPERIMENT_WEBHOOK_*
# EXPERIMENT_WEBHOOK_HOST=127.0.0.1
# EXPERIMENT_WEBHOOK_PORT=8791
# EXPERIMENT_WEBHOOK_SIGNATURE=on
# EXPERIMENT_WEBHOOK_REPORTS_DIR=
# EXPERIMENT_RUN_TIMEOUT_SECONDS=600

# LANGFUSE_*
# LANGFUSE_HOST=
# LANGFUSE_PUBLIC_KEY=
# LANGFUSE_SECRET_KEY=
# LANGFUSE_WEBHOOK_SECRET=
`;

const SECRET_KEY = /(SECRET|TOKEN|PASSWORD|PRIVATE|CREDENTIAL|_KEY)$/i;

export function configHome(env: NodeJS.ProcessEnv): string {
  if (env.XDG_CONFIG_HOME?.trim()) {
    return env.XDG_CONFIG_HOME.trim();
  }
  const home = env.HOME || env.USERPROFILE || "";
  return path.join(home, ".config");
}

export function defaultEdgesConfigPath(env: NodeJS.ProcessEnv = process.env): string {
  if (env.EDGES_CONFIG?.trim()) {
    return env.EDGES_CONFIG.trim();
  }
  return path.join(configHome(env), "edges", "edges.env");
}

export function legacyArtifactsEnvPath(env: NodeJS.ProcessEnv = process.env): string {
  return path.join(configHome(env), "edges", "artifacts-preview.env");
}

export function edgesConfigMigrationMessage(env: NodeJS.ProcessEnv, missingPath?: string): string {
  const next = missingPath ?? defaultEdgesConfigPath(env);
  const legacy = legacyArtifactsEnvPath(env);
  return [
    `missing ${next}`,
    `edges no longer reads ${legacy}.`,
    "Migrate with: edges config init",
    "That copies artifacts-preview.env into edges.env when the old file is present, and does not keep reading the old file.",
  ].join("\n");
}

export function assertUnifiedConfigPath(env: NodeJS.ProcessEnv, configPath: string): void {
  const legacy = path.resolve(legacyArtifactsEnvPath(env));
  if (path.resolve(configPath) === legacy) {
    throw new EdgesConfigError(
      [
        `edges no longer reads ${legacy}.`,
        "Migrate with: edges config init",
        "That copies artifacts-preview.env into edges.env when the old file is present.",
      ].join("\n"),
    );
  }
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

export function redactEnvValue(key: string, value: string): string {
  if (value && SECRET_KEY.test(key)) {
    return "***";
  }
  return value;
}

export function redactEnv(values: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(values)) {
    out[key] = redactEnvValue(key, value);
  }
  return out;
}

export function mergeEnvText(raw: string, updates: Record<string, string>): string {
  const lines = raw.split(/\r?\n/);
  const pending = { ...updates };
  const next = lines.map((line) => {
    const match = line.match(/^(\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*)=(.*)$/);
    if (!match) {
      return line;
    }
    const key = match[2];
    if (!(key in pending)) {
      return line;
    }
    const value = pending[key];
    delete pending[key];
    return `${match[1]}${key}${match[3]}=${value}`;
  });
  const extras = Object.entries(pending).map(([key, value]) => `${key}=${value}`);
  if (extras.length > 0) {
    while (next.length > 0 && next[next.length - 1] === "") {
      next.pop();
    }
    next.push(...extras, "");
  }
  const body = next.join("\n");
  return body.endsWith("\n") ? body : `${body}\n`;
}

export function resolveEdgesConfigPath(env: NodeJS.ProcessEnv, configPath?: string): string {
  const resolved = configPath?.trim() || defaultEdgesConfigPath(env);
  assertUnifiedConfigPath(env, resolved);
  return resolved;
}

export async function readEdgesEnv(env: NodeJS.ProcessEnv, configPath?: string): Promise<{
  path: string;
  values: Record<string, string>;
  raw: string;
}> {
  const resolved = resolveEdgesConfigPath(env, configPath);
  try {
    const raw = await readFile(resolved, "utf8");
    return { path: resolved, values: parseEnvFile(raw), raw };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      throw new EdgesConfigError(edgesConfigMigrationMessage(env, resolved));
    }
    throw error;
  }
}

export async function upsertEnvAssignments(
  configPath: string,
  updates: Record<string, string>,
): Promise<void> {
  const raw = await readFile(configPath, "utf8");
  await mkdir(path.dirname(configPath), { recursive: true });
  await writeFile(configPath, mergeEnvText(raw, updates), { encoding: "utf8", mode: 0o600 });
  await chmod(configPath, 0o600);
}

function missingSections(body: string): string {
  let extra = "";
  if (!body.includes("EXPERIMENT_WEBHOOK_")) {
    extra += [
      "",
      "# EXPERIMENT_WEBHOOK_*",
      "# EXPERIMENT_WEBHOOK_HOST=127.0.0.1",
      "# EXPERIMENT_WEBHOOK_PORT=8791",
      "# EXPERIMENT_WEBHOOK_SIGNATURE=on",
      "",
    ].join("\n");
  }
  if (!body.includes("LANGFUSE_")) {
    extra += [
      "# LANGFUSE_*",
      "# LANGFUSE_HOST=",
      "# LANGFUSE_PUBLIC_KEY=",
      "# LANGFUSE_SECRET_KEY=",
      "# LANGFUSE_WEBHOOK_SECRET=",
      "",
    ].join("\n");
  }
  return extra;
}

export async function initEdgesConfig(options: {
  env: NodeJS.ProcessEnv;
  configPath?: string;
}): Promise<{ path: string; created: boolean; migrated: boolean; stderr: string }> {
  const resolved = resolveEdgesConfigPath(options.env, options.configPath);
  try {
    await readFile(resolved, "utf8");
    return {
      path: resolved,
      created: false,
      migrated: false,
      stderr: `${resolved} already exists. Not overwritten.\n`,
    };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") {
      throw error;
    }
  }

  await mkdir(path.dirname(resolved), { recursive: true });
  const legacy = legacyArtifactsEnvPath(options.env);
  let migrated = false;
  let body = EDGES_ENV_TEMPLATE;
  if (path.resolve(legacy) !== path.resolve(resolved)) {
    try {
      const old = await readFile(legacy, "utf8");
      migrated = true;
      const copied = old.endsWith("\n") ? old : `${old}\n`;
      body = [
        "# Migrated by edges config init from artifacts-preview.env.",
        "# edges no longer reads that file.",
        copied.replace(/^\n/, ""),
        missingSections(copied),
      ].join("\n");
      if (!body.endsWith("\n")) {
        body += "\n";
      }
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "ENOENT") {
        throw error;
      }
    }
  }
  await writeFile(resolved, body, { encoding: "utf8", mode: 0o600 });
  await chmod(resolved, 0o600);
  if (migrated) {
    return {
      path: resolved,
      created: true,
      migrated: true,
      stderr: [
        `Copied ${legacy} into ${resolved}.`,
        `edges no longer reads ${legacy}.`,
        "Check with: edges config show",
        "",
      ].join("\n"),
    };
  }
  return {
    path: resolved,
    created: true,
    migrated: false,
    stderr: [
      `Created ${resolved}.`,
      "Fill EDGES_ARTIFACTS_* , EXPERIMENT_WEBHOOK_* , and LANGFUSE_* in that file.",
      "",
    ].join("\n"),
  };
}

export async function showEdgesConfig(options: {
  env: NodeJS.ProcessEnv;
  configPath?: string;
}): Promise<{ path: string; values: Record<string, string> }> {
  const loaded = await readEdgesEnv(options.env, options.configPath);
  return { path: loaded.path, values: redactEnv(loaded.values) };
}
