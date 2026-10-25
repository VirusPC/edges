import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { EdgesConfigError, configHome, readEdgesEnv, upsertEnvAssignments } from "../../config/edges-env.js";
import { resolveEdgesRoot } from "../../../utils/config.js";
import { type RunCommand, runCommand as defaultRunCommand } from "../../artifacts/server/run-command.js";
import { EvaluationError } from "../error.js";

export const UNIT_NAME = "edges-evaluation.service";
export const DEFAULT_HOST = "127.0.0.1";
export const DEFAULT_PORT = 8791;

export type HealthFetch = (url: string) => Promise<Response>;

export type ForegroundSpec = {
  command: string;
  args: string[];
  cwd: string;
  env: NodeJS.ProcessEnv;
};

export type ForegroundRun = (spec: ForegroundSpec) => Promise<{ exitCode: number }>;

export type EvaluationServerDeps = {
  env: NodeJS.ProcessEnv;
  configPath?: string;
  repoRoot?: string;
  runCommand?: RunCommand;
  runForeground?: ForegroundRun;
  fetchHealth?: HealthFetch;
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

export function evaluationServiceDir(repoRoot: string): string {
  return path.join(repoRoot, "packages/services/evaluation");
}

export function resolveRepoRoot(): string {
  return resolveEdgesRoot();
}

export function listenFromValues(values: Record<string, string>): { host: string; port: number } {
  const host = values.EXPERIMENT_WEBHOOK_HOST || values.HOST || DEFAULT_HOST;
  const portRaw = values.EXPERIMENT_WEBHOOK_PORT || values.PORT;
  const parsed = portRaw ? Number(portRaw) : DEFAULT_PORT;
  const port = Number.isInteger(parsed) && parsed >= 1 && parsed <= 65535 ? parsed : DEFAULT_PORT;
  return { host, port };
}

export function healthProbeHost(host: string): string {
  if (host === "0.0.0.0" || host === "::") {
    return "127.0.0.1";
  }
  return host;
}

function healthUrl(host: string, port: number): string {
  return `http://${healthProbeHost(host)}:${port}/health`;
}

async function loadListen(options: EvaluationServerDeps): Promise<{
  path: string;
  values: Record<string, string>;
  host: string;
  port: number;
}> {
  try {
    const loaded = await readEdgesEnv(options.env, options.configPath);
    const listen = listenFromValues(loaded.values);
    return { path: loaded.path, values: loaded.values, ...listen };
  } catch (error) {
    if (error instanceof EdgesConfigError) {
      throw new EvaluationError("VALIDATION_ERROR", error.message);
    }
    throw error;
  }
}

function devEnv(base: NodeJS.ProcessEnv, file: Record<string, string>, serviceDir: string): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...base };
  for (const [key, value] of Object.entries(file)) {
    if (!env[key]) {
      env[key] = value;
    }
  }
  env.PYTHONPATH = [serviceDir, env.PYTHONPATH].filter(Boolean).join(path.delimiter);
  return env;
}

export function devCommand(repoRoot: string): { command: string; args: string[]; cwd: string } {
  const cwd = evaluationServiceDir(repoRoot);
  return { command: "python3", args: ["-m", "experiment_webhook"], cwd };
}

export const runForeground: ForegroundRun = (spec) =>
  new Promise((resolve, reject) => {
    const child = spawn(spec.command, spec.args, {
      cwd: spec.cwd,
      env: spec.env,
      stdio: "inherit",
    });
    const stop = (signal: NodeJS.Signals) => {
      if (!child.killed) {
        child.kill(signal);
      }
    };
    process.once("SIGINT", stop);
    process.once("SIGTERM", stop);
    const clear = () => {
      process.off("SIGINT", stop);
      process.off("SIGTERM", stop);
    };
    child.on("error", (error) => {
      clear();
      reject(error);
    });
    child.on("exit", (code) => {
      clear();
      resolve({ exitCode: code ?? 1 });
    });
  });

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

export async function installEvaluationServer(options: EvaluationServerDeps): Promise<{
  started: false;
  repoRoot: string;
  serviceDir: string;
  unit: string;
  configPath: string;
  host: string;
  port: number;
}> {
  const env = options.env;
  const run = options.runCommand ?? defaultRunCommand;
  const loaded = await loadListen(options);
  const updates: Record<string, string> = {};
  if (!loaded.values.EXPERIMENT_WEBHOOK_HOST && !loaded.values.HOST) {
    updates.EXPERIMENT_WEBHOOK_HOST = DEFAULT_HOST;
  }
  if (!loaded.values.EXPERIMENT_WEBHOOK_PORT && !loaded.values.PORT) {
    updates.EXPERIMENT_WEBHOOK_PORT = String(DEFAULT_PORT);
  }
  if (Object.keys(updates).length > 0) {
    await upsertEnvAssignments(loaded.path, updates);
  }
  const repoRoot = options.repoRoot?.trim() || resolveRepoRoot();
  const serviceDir = evaluationServiceDir(repoRoot);
  const unitSrc = path.join(serviceDir, "deploy", UNIT_NAME);
  let unitText: string;
  try {
    unitText = await readFile(unitSrc, "utf8");
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      throw new EvaluationError("UNKNOWN_ERROR", `missing unit template ${unitSrc}`);
    }
    throw error;
  }
  unitText = unitText.replaceAll("@SERVICE_DIR@", serviceDir);
  const unitDir = path.join(configHome(env), "systemd", "user");
  await mkdir(unitDir, { recursive: true });
  await writeFile(path.join(unitDir, UNIT_NAME), unitText, { encoding: "utf8" });

  const userEnv = systemdEnv(env);
  const reload = await run("systemctl", ["--user", "daemon-reload"], { env: userEnv });
  if (reload.exitCode !== 0) {
    throw new EvaluationError(
      "UNKNOWN_ERROR",
      `systemctl --user failed. One-time: sudo loginctl enable-linger "$USER". ${reload.stderr.trim()}`,
    );
  }
  const enabled = await run("systemctl", ["--user", "enable", UNIT_NAME], { env: userEnv });
  if (enabled.exitCode !== 0) {
    throw new EvaluationError("UNKNOWN_ERROR", `systemctl --user enable failed: ${enabled.stderr.trim()}`);
  }
  const listen = listenFromValues({ ...loaded.values, ...updates });
  return {
    started: false,
    repoRoot,
    serviceDir,
    unit: UNIT_NAME,
    configPath: loaded.path,
    host: listen.host,
    port: listen.port,
  };
}

async function unitStatus(run: RunCommand, env: NodeJS.ProcessEnv): Promise<string> {
  const unit = await run("systemctl", ["--user", "--no-pager", "--full", "status", UNIT_NAME], {
    env: systemdEnv(env),
  });
  return unit.stdout.trim() || unit.stderr.trim();
}

async function lifecycle(
  verb: "start" | "restart",
  options: EvaluationServerDeps,
): Promise<{ healthy: boolean; health: string; unit: string; host: string; port: number }> {
  const loaded = await loadListen(options);
  const env = options.env;
  const run = options.runCommand ?? defaultRunCommand;
  const fetchHealth = options.fetchHealth ?? ((url: string) => fetch(url));
  const result = await run("systemctl", ["--user", verb, UNIT_NAME], { env: systemdEnv(env) });
  if (result.exitCode !== 0) {
    throw new EvaluationError("UNKNOWN_ERROR", `systemctl --user ${verb} failed: ${result.stderr.trim()}`);
  }
  const health = await waitForHealth(healthUrl(loaded.host, loaded.port), fetchHealth);
  if (!health.healthy) {
    throw new EvaluationError("UNKNOWN_ERROR", `${verb}ed but health failed: ${health.health}`);
  }
  return { ...health, unit: await unitStatus(run, env), host: loaded.host, port: loaded.port };
}

export async function startEvaluationServer(options: EvaluationServerDeps & { dev?: boolean }): Promise<{
  mode: "systemd" | "dev";
  healthy?: boolean;
  health?: string;
  unit?: string;
  host: string;
  port: number;
  exitCode?: number;
  serviceDir?: string;
}> {
  if (!options.dev) {
    const started = await lifecycle("start", options);
    return { mode: "systemd", ...started };
  }
  const loaded = await loadListen(options);
  const repoRoot = options.repoRoot?.trim() || resolveRepoRoot();
  const spec = devCommand(repoRoot);
  const run = options.runForeground ?? runForeground;
  let exitCode: number;
  try {
    const result = await run({
      ...spec,
      env: devEnv(options.env, loaded.values, spec.cwd),
    });
    exitCode = result.exitCode;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new EvaluationError("UNKNOWN_ERROR", `evaluation server --dev failed: ${message}`);
  }
  if (exitCode !== 0) {
    throw new EvaluationError("UNKNOWN_ERROR", `evaluation server --dev exited ${exitCode}`);
  }
  return {
    mode: "dev",
    host: loaded.host,
    port: loaded.port,
    exitCode,
    serviceDir: spec.cwd,
  };
}

export async function stopEvaluationServer(options: EvaluationServerDeps): Promise<{ stopped: true; unit: string }> {
  const env = options.env;
  const run = options.runCommand ?? defaultRunCommand;
  const result = await run("systemctl", ["--user", "stop", UNIT_NAME], { env: systemdEnv(env) });
  if (result.exitCode !== 0) {
    throw new EvaluationError("UNKNOWN_ERROR", `systemctl --user stop failed: ${result.stderr.trim()}`);
  }
  return { stopped: true, unit: await unitStatus(run, env) };
}

export function restartEvaluationServer(options: EvaluationServerDeps) {
  return lifecycle("restart", options);
}

export async function statusEvaluationServer(options: EvaluationServerDeps): Promise<{
  healthy: boolean;
  health: string;
  unit: string;
  host: string;
  port: number;
}> {
  const loaded = await loadListen(options);
  const run = options.runCommand ?? defaultRunCommand;
  const fetchHealth = options.fetchHealth ?? ((url: string) => fetch(url));
  let healthText = "";
  let healthy = false;
  try {
    const res = await fetchHealth(healthUrl(loaded.host, loaded.port));
    healthText = (await res.text()).trim();
    healthy = res.ok;
  } catch (error) {
    healthText = error instanceof Error ? error.message : String(error);
  }
  return {
    healthy,
    health: healthText,
    unit: await unitStatus(run, options.env),
    host: loaded.host,
    port: loaded.port,
  };
}
