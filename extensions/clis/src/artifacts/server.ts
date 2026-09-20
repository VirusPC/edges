import { randomBytes } from "node:crypto";
import { Command } from "commander";
import type { CliContext } from "../context.js";
import { ArtifactsError, runArtifactsCommand, succeed } from "./utils/result.js";
import {
  DEFAULT_HOST,
  DEFAULT_PORT,
  DEFAULT_PUBLIC_BASE_URL,
  defaultDataDir,
  defaultServerConfigPath,
  loadServerEnv,
  writeServerEnv,
} from "./server/env.js";
import {
  installArtifactsServer,
  restartArtifactsServer,
  startArtifactsServer,
  statusArtifactsServer,
  stopArtifactsServer,
} from "./server/ops.js";

const SERVER_AFTER_HELP = `
COMMANDS
  init [--base-url <url>] [--host <host>] [--port <n>] [--data-dir <path>] [--token <hex>] [--config <path>] [--force]
    Write ~/.config/edges/artifacts-preview.env only. Does not start a process.
  install
    pnpm install/build + install/enable the user systemd unit. Does not start.
  start | stop | restart
    Process lifecycle only (systemctl --user).
  status
    curl 127.0.0.1/health + systemctl --user status

Never combine install and start. After a repo pull: install (if build/unit changed) then restart.

nginx reverse-proxy is host ops, not a CLI verb. Static files live in
extensions/services/artifacts-preview/deploy/ (nginx-artifacts.conf plus
setup-nginx-artifacts.sh). Run that sudo script once when exposing on :80.

EXAMPLES
  edges artifacts server init --base-url http://182.92.131.89
  edges artifacts server install
  edges artifacts server start
  edges artifacts server status
  sudo bash extensions/services/artifacts-preview/deploy/setup-nginx-artifacts.sh
`;

async function listenTarget(env: NodeJS.ProcessEnv, configPath?: string): Promise<{ host: string; port: number }> {
  const loaded = await loadServerEnv(env, configPath);
  return {
    host: loaded.host || DEFAULT_HOST,
    port: loaded.port ?? DEFAULT_PORT,
  };
}

export function addArtifactsServerCommand(artifacts: Command, ctx: CliContext): void {
  const server = artifacts
    .command("server")
    .description("Run the Artifacts preview HTTP process on this machine")
    .allowExcessArguments(false)
    .showHelpAfterError(false)
    .helpOption("-h, --help", "Show this help")
    .addHelpText("after", SERVER_AFTER_HELP);

  server.action(() => {
    ctx.result = {
      exitCode: 2,
      stdout: `${JSON.stringify({
        status: "failed",
        errorCode: "VALIDATION_ERROR",
        reason: "missing artifacts server subcommand. Use edges artifacts server --help.",
      })}\n`,
      stderr: "See edges artifacts server --help for usage.\n",
    };
  });

  server
    .command("init")
    .description("Write the server env file (token + listen/public URL). Does not start.")
    .option("--base-url <url>", "Public URL prefix printed by publish", DEFAULT_PUBLIC_BASE_URL)
    .option("--host <host>", "Listen host (loopback behind nginx)", DEFAULT_HOST)
    .option("--port <n>", "Listen port", String(DEFAULT_PORT))
    .option("--data-dir <path>", "Artifact data directory")
    .option("--token <hex>", "Reuse an existing shared token")
    .option("--config <path>", "Server env path (default: ~/.config/edges/artifacts-preview.env)")
    .option("--force", "Overwrite an existing token")
    .action(async (opts: {
      baseUrl: string;
      host: string;
      port: string;
      dataDir?: string;
      token?: string;
      config?: string;
      force?: boolean;
    }) => {
      await runArtifactsCommand(ctx, async () => {
        const configPath = opts.config?.trim() || defaultServerConfigPath(ctx.env);
        const existing = await loadServerEnv(ctx.env, configPath);
        if (existing.token && !opts.force) {
          throw new ArtifactsError(
            "VALIDATION_ERROR",
            `server env already has a token: ${configPath} (pass --force to overwrite)`,
          );
        }
        const port = Number(opts.port);
        if (!Number.isInteger(port) || port < 1 || port > 65535) {
          throw new ArtifactsError("VALIDATION_ERROR", "port must be an integer 1–65535");
        }
        const token = opts.token?.trim() || randomBytes(32).toString("hex");
        const values = {
          token,
          baseUrl: opts.baseUrl.replace(/\/$/, ""),
          host: opts.host.trim() || DEFAULT_HOST,
          port,
          dataDir: opts.dataDir?.trim() || defaultDataDir(ctx.env),
          configPath,
        };
        await writeServerEnv(values);
        const stderr = [
          "Wrote server env (config only; no process started):",
          `  ${configPath}`,
          `  EDGES_ARTIFACTS_TOKEN=${token}`,
          `  EDGES_ARTIFACTS_BASE_URL=${values.baseUrl}`,
          `  EDGES_ARTIFACTS_HOST=${values.host}`,
          `  EDGES_ARTIFACTS_PORT=${values.port}`,
          `  EDGES_ARTIFACTS_DATA_DIR=${values.dataDir}`,
          "",
          "Laptop client (same token):",
          `  edges artifacts init --base-url ${values.baseUrl}`,
          "",
          "Then on this machine:",
          "  edges artifacts server install        # deps + unit; does not start",
          "  edges artifacts server start",
          "  edges artifacts server status",
          "",
          "To expose on :80, separately run the one-time sudo script:",
          "  sudo bash extensions/services/artifacts-preview/deploy/setup-nginx-artifacts.sh",
          "",
        ].join("\n");
        return succeed(
          {
            command: "artifacts.server.init",
            configPath,
            baseUrl: values.baseUrl,
            host: values.host,
            port: values.port,
            dataDir: values.dataDir,
            tokenCreated: !opts.token,
          },
          stderr,
        );
      });
    });

  server
    .command("install")
    .description("Install deps, build, and enable the user unit. Does not start.")
    .option("--config <path>", "Server env path")
    .action(async (opts: { config?: string }) => {
      await runArtifactsCommand(ctx, async () => {
        const installed = await installArtifactsServer({
          env: ctx.env,
          envFile: opts.config,
        });
        return succeed(
          {
            command: "artifacts.server.install",
            ...installed,
          },
          "Unit installed and enabled. Not started. Run: edges artifacts server start\n",
        );
      });
    });

  server
    .command("start")
    .description("Start the user systemd unit")
    .option("--config <path>", "Server env path")
    .action(async (opts: { config?: string }) => {
      await runArtifactsCommand(ctx, async () => {
        const listen = await listenTarget(ctx.env, opts.config);
        const started = await startArtifactsServer({ env: ctx.env, ...listen });
        return succeed({ command: "artifacts.server.start", ...started, ...listen });
      });
    });

  server
    .command("stop")
    .description("Stop the user systemd unit")
    .action(async () => {
      await runArtifactsCommand(ctx, async () => {
        const stopped = await stopArtifactsServer({ env: ctx.env });
        return succeed({ command: "artifacts.server.stop", ...stopped });
      });
    });

  server
    .command("restart")
    .description("Restart the user systemd unit")
    .option("--config <path>", "Server env path")
    .action(async (opts: { config?: string }) => {
      await runArtifactsCommand(ctx, async () => {
        const listen = await listenTarget(ctx.env, opts.config);
        const restarted = await restartArtifactsServer({ env: ctx.env, ...listen });
        return succeed({ command: "artifacts.server.restart", ...restarted, ...listen });
      });
    });

  server
    .command("status")
    .description("Show /health and systemctl --user status")
    .option("--config <path>", "Server env path")
    .action(async (opts: { config?: string }) => {
      await runArtifactsCommand(ctx, async () => {
        const listen = await listenTarget(ctx.env, opts.config);
        const status = await statusArtifactsServer({ env: ctx.env, ...listen });
        const result = succeed({ command: "artifacts.server.status", ...status, ...listen });
        if (!status.healthy) {
          return { ...result, exitCode: 1 };
        }
        return result;
      });
    });
}
