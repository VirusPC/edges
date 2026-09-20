import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadConfig } from "../../utils/config.js";
import { ArtifactsError } from "../utils/result.js";
import {
  UNIT_NAME,
  assertUsableToken,
  configHome,
  defaultDataDir,
  defaultServerConfigPath,
  ensureServerEnv,
} from "./env.js";
import { type RunCommand, runCommand as defaultRunCommand } from "./run-command.js";

export type HealthFetch = (url: string) => Promise<Response>;

export type ServerOpsDeps = {
  env: NodeJS.ProcessEnv;
  runCommand?: RunCommand;
  fetchHealth?: HealthFetch;
  getUid?: () => number;
};

function systemdEnv(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const uid = process.getuid?.() ?? 1000;
  const runtime = env.XDG_RUNTIME_DIR || `/run/user/${uid}`;
  const next: NodeJS.ProcessEnv = { ...env, XDG_RUNTIME_DIR: runtime };
  if (!next.DBUS_SESSION_BUS_ADDRESS) {
    next.DBUS_SESSION_BUS_ADDRESS = `unix:path=${runtime}/bus`;
  }
  return next;
}

function healthUrl(host: string, port: number): string {
  return `http://${host}:${port}/health`;
}

async function waitForHealth(
  url: string,
  fetchHealth: HealthFetch,
): Promise<{ healthy: boolean; health: string }> {
  let last = "";
  for (let i = 0; i < 8; i++) {
    try {
      const res = await fetchHealth(url);
      last = await res.text();
      if (res.ok) {
        return { healthy: true, health: last.trim() };
      }
    } catch (error) {
      last = error instanceof Error ? error.message : String(error);
    }
    if (i < 7) {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  return { healthy: false, health: last };
}

export function artifactsDeployDir(repoRoot: string): string {
  return path.join(repoRoot, "extensions/services/artifacts-preview/deploy");
}

export function resolveRepoRoot(env: NodeJS.ProcessEnv): string {
  return loadConfig(env).repoPath;
}

export async function installArtifactsServer(options: ServerOpsDeps & {
  envFile?: string;
  repoRoot?: string;
  force?: boolean;
  baseUrl?: string;
  host?: string;
  port?: number;
  dataDir?: string;
  token?: string;
}): Promise<{
  started: false;
  dataDir: string;
  repoRoot: string;
  unit: string;
  configPath: string;
  baseUrl: string;
  host: string;
  port: number;
  token: string;
  tokenCreated: boolean;
  tokenRotated: boolean;
}> {
  const env = options.env;
  const run = options.runCommand ?? defaultRunCommand;
  const envFile = options.envFile?.trim() || defaultServerConfigPath(env);
  const ensured = await ensureServerEnv({
    env,
    configPath: envFile,
    force: options.force,
    baseUrl: options.baseUrl,
    host: options.host,
    port: options.port,
    dataDir: options.dataDir,
    token: options.token,
  });
  try {
    assertUsableToken(ensured.token, ensured.configPath);
  } catch (error) {
    throw new ArtifactsError("VALIDATION_ERROR", error instanceof Error ? error.message : String(error));
  }
  const repoRoot = options.repoRoot?.trim() || resolveRepoRoot(env);
  const dataDir = ensured.dataDir || defaultDataDir(env);
  await mkdir(dataDir, { recursive: true, mode: 0o700 });

  const install = await run(
    "pnpm",
    ["install", "--frozen-lockfile", "--filter", "edges-artifacts-preview..."],
    { cwd: repoRoot, env },
  );
  if (install.exitCode !== 0) {
    throw new ArtifactsError(
      "UNKNOWN_ERROR",
      `pnpm install failed: ${install.stderr.trim() || install.stdout.trim()}`,
    );
  }
  const build = await run("pnpm", ["--filter", "edges-artifacts-preview", "build"], {
    cwd: repoRoot,
    env,
  });
  if (build.exitCode !== 0) {
    throw new ArtifactsError(
      "UNKNOWN_ERROR",
      `pnpm build failed: ${build.stderr.trim() || build.stdout.trim()}`,
    );
  }

  const unitDir = path.join(configHome(env), "systemd", "user");
  await mkdir(path.join(unitDir, `${UNIT_NAME}.d`), { recursive: true });
  const unitSrc = path.join(artifactsDeployDir(repoRoot), UNIT_NAME);
  const unitText = await readFile(unitSrc, "utf8");
  await writeFile(path.join(unitDir, UNIT_NAME), unitText, { encoding: "utf8" });
  const pathValue = `${path.dirname(process.execPath)}:${env.PATH ?? "/usr/local/bin:/usr/bin:/bin"}`;
  await writeFile(
    path.join(unitDir, `${UNIT_NAME}.d`, "node-path.conf"),
    `[Service]\nEnvironment=PATH=${pathValue}\n`,
    { encoding: "utf8" },
  );

  const userEnv = systemdEnv(env);
  const reload = await run("systemctl", ["--user", "daemon-reload"], { env: userEnv });
  if (reload.exitCode !== 0) {
    throw new ArtifactsError(
      "UNKNOWN_ERROR",
      `systemctl --user failed. One-time: sudo loginctl enable-linger "$USER". ${reload.stderr.trim()}`,
    );
  }
  const enabled = await run("systemctl", ["--user", "enable", UNIT_NAME], { env: userEnv });
  if (enabled.exitCode !== 0) {
    throw new ArtifactsError("UNKNOWN_ERROR", `systemctl --user enable failed: ${enabled.stderr.trim()}`);
  }
  return {
    started: false,
    dataDir,
    repoRoot,
    unit: UNIT_NAME,
    configPath: ensured.configPath,
    baseUrl: ensured.baseUrl,
    host: ensured.host,
    port: ensured.port,
    token: ensured.token,
    tokenCreated: ensured.tokenCreated,
    tokenRotated: ensured.tokenRotated,
  };
}

export async function setupNginxArtifacts(options: ServerOpsDeps & {
  repoRoot?: string;
}): Promise<{ applied: boolean; sudo: boolean; command: string }> {
  const env = options.env;
  const run = options.runCommand ?? defaultRunCommand;
  const repoRoot = options.repoRoot?.trim() || resolveRepoRoot(env);
  const script = path.join(artifactsDeployDir(repoRoot), "setup-nginx-artifacts.sh");
  const command = `sudo bash ${script}`;
  const uid = (options.getUid ?? (() => process.getuid?.() ?? 1000))();

  if (uid === 0) {
    const result = await run("bash", [script], { env });
    if (result.exitCode !== 0) {
      throw new ArtifactsError(
        "UNKNOWN_ERROR",
        result.stderr.trim() || result.stdout.trim() || "setup-nginx-artifacts.sh failed",
      );
    }
    return { applied: true, sudo: false, command };
  }

  try {
    const escalated = await run("sudo", ["-n", "bash", script], { env });
    if (escalated.exitCode === 0) {
      return { applied: true, sudo: true, command };
    }
  } catch {
    // sudo missing or cannot run non-interactively
  }

  throw new ArtifactsError(
    "UNKNOWN_ERROR",
    [
      "setup-nginx needs root to write nginx config (does not change /teaching/).",
      `Run: ${command}`,
    ].join(" "),
  );
}

async function unitStatus(run: RunCommand, env: NodeJS.ProcessEnv): Promise<string> {
  const unit = await run(
    "systemctl",
    ["--user", "--no-pager", "--full", "status", UNIT_NAME],
    { env: systemdEnv(env) },
  );
  return unit.stdout.trim() || unit.stderr.trim();
}

async function lifecycle(
  verb: "start" | "stop" | "restart",
  options: ServerOpsDeps & { host?: string; port?: number },
): Promise<{ healthy?: boolean; health?: string; stopped?: boolean; unit: string }> {
  const env = options.env;
  const run = options.runCommand ?? defaultRunCommand;
  const fetchHealth = options.fetchHealth ?? ((url: string) => fetch(url));
  const result = await run("systemctl", ["--user", verb, UNIT_NAME], { env: systemdEnv(env) });
  if (result.exitCode !== 0) {
    throw new ArtifactsError("UNKNOWN_ERROR", `systemctl --user ${verb} failed: ${result.stderr.trim()}`);
  }
  if (verb === "stop") {
    return { stopped: true, unit: await unitStatus(run, env) };
  }
  const health = await waitForHealth(healthUrl(options.host ?? "127.0.0.1", options.port ?? 8787), fetchHealth);
  if (!health.healthy) {
    throw new ArtifactsError("UNKNOWN_ERROR", `${verb}ed but health failed: ${health.health}`);
  }
  return { ...health, unit: await unitStatus(run, env) };
}

export async function statusArtifactsServer(options: ServerOpsDeps & {
  host?: string;
  port?: number;
}): Promise<{ healthy: boolean; health: string; unit: string }> {
  const env = options.env;
  const run = options.runCommand ?? defaultRunCommand;
  const fetchHealth = options.fetchHealth ?? ((url: string) => fetch(url));
  const host = options.host ?? "127.0.0.1";
  const port = options.port ?? 8787;
  let healthText = "";
  let healthy = false;
  try {
    const res = await fetchHealth(healthUrl(host, port));
    healthText = (await res.text()).trim();
    healthy = res.ok;
  } catch (error) {
    healthText = error instanceof Error ? error.message : String(error);
  }
  return {
    healthy,
    health: healthText,
    unit: await unitStatus(run, env),
  };
}

export function startArtifactsServer(options: ServerOpsDeps & { host?: string; port?: number }) {
  return lifecycle("start", options) as Promise<{ healthy: boolean; health: string; unit: string }>;
}

export function stopArtifactsServer(options: ServerOpsDeps) {
  return lifecycle("stop", options) as Promise<{ stopped: boolean; unit: string }>;
}

export function restartArtifactsServer(options: ServerOpsDeps & { host?: string; port?: number }) {
  return lifecycle("restart", options) as Promise<{ healthy: boolean; health: string; unit: string }>;
}
