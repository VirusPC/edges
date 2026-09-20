import { Command } from "commander";
import type { CliContext } from "../context.js";
import { ArtifactsError, runArtifactsCommand, succeed } from "./utils/result.js";
import {
  DEFAULT_HOST,
  DEFAULT_PORT,
  DEFAULT_PUBLIC_BASE_URL,
  loadServerEnv,
} from "./server/env.js";
import {
  installArtifactsServer,
  restartArtifactsServer,
  setupNginxArtifacts,
  startArtifactsServer,
  statusArtifactsServer,
  stopArtifactsServer,
} from "./server/ops.js";

const SERVER_AFTER_HELP = `
COMMANDS
  install [--force] [--base-url <url>] [--config <path>]
    Ensure ~/.config/edges/artifacts-preview.env (create token if missing;
    --force may rotate), pnpm install/build, install and enable the user unit.
    Does not start.
  start | stop | restart
    Process lifecycle only (systemctl --user).
  status
    User unit + curl 127.0.0.1/health
  setup-nginx
    One-shot / idempotent reverse proxy: /health, POST /artifacts, /artifacts/…
    → 127.0.0.1:8787. Does not change /teaching/. If sudo is needed, prints the
    exact sudo command.

Never combine install and start.

First time on ECS:
  edges artifacts server install
  edges artifacts server start
  edges artifacts server setup-nginx
  edges artifacts server status

After a deploy-teach pull (env already on the box):
  edges artifacts server install   # if build/unit changed
  edges artifacts server restart   # or restart only

Laptop client (same token as the server env):
  edges artifacts init --base-url http://182.92.131.89
  edges artifacts publish <path>
  edges artifacts rm <id|url>

Rotate token:
  edges artifacts server install --force
  edges artifacts server restart
  edges artifacts init --base-url http://182.92.131.89 --token <printed token> --force
`;

async function listenTarget(env: NodeJS.ProcessEnv, configPath?: string): Promise<{ host: string; port: number }> {
  const loaded = await loadServerEnv(env, configPath);
  return {
    host: loaded.host || DEFAULT_HOST,
    port: loaded.port ?? DEFAULT_PORT,
  };
}

function installStderr(installed: {
  token: string;
  baseUrl: string;
  tokenCreated: boolean;
  tokenRotated: boolean;
}): string {
  if (installed.tokenCreated) {
    return [
      "Created server env. Share this token with the laptop client:",
      `  EDGES_ARTIFACTS_TOKEN=${installed.token}`,
      `  EDGES_ARTIFACTS_BASE_URL=${installed.baseUrl}`,
      "",
      "Laptop client (same token):",
      `  edges artifacts init --base-url ${installed.baseUrl} --token ${installed.token}`,
      "",
      "Unit installed and enabled. Not started.",
      "Next: edges artifacts server start",
      "Then: edges artifacts server setup-nginx",
      "Then: edges artifacts server status",
      "",
    ].join("\n");
  }
  if (installed.tokenRotated) {
    return [
      "Rotated server token. Reload the unit, then re-init the laptop client:",
      `  EDGES_ARTIFACTS_TOKEN=${installed.token}`,
      `  EDGES_ARTIFACTS_BASE_URL=${installed.baseUrl}`,
      "",
      "Unit installed and enabled. Not started.",
      "Next: edges artifacts server restart",
      `Then: edges artifacts init --base-url ${installed.baseUrl} --token ${installed.token} --force`,
      "",
    ].join("\n");
  }
  return "Server env exists (token unchanged). Unit installed and enabled. Not started.\n";
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
    .command("install")
    .description("Ensure server env, build, and enable the user unit. Does not start.")
    .option("--base-url <url>", "Public URL prefix when creating env", DEFAULT_PUBLIC_BASE_URL)
    .option("--host <host>", "Listen host when creating env", DEFAULT_HOST)
    .option("--port <n>", "Listen port when creating env", String(DEFAULT_PORT))
    .option("--data-dir <path>", "Artifact data directory when creating env")
    .option("--token <hex>", "Reuse an existing shared token when creating env")
    .option("--config <path>", "Server env path (default: ~/.config/edges/artifacts-preview.env)")
    .option("--force", "Rotate an existing token")
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
        const port = Number(opts.port);
        if (!Number.isInteger(port) || port < 1 || port > 65535) {
          throw new ArtifactsError("VALIDATION_ERROR", "port must be an integer 1–65535");
        }
        const installed = await installArtifactsServer({
          env: ctx.env,
          envFile: opts.config,
          force: opts.force,
          baseUrl: opts.baseUrl,
          host: opts.host,
          port,
          dataDir: opts.dataDir,
          token: opts.token,
        });
        return succeed(
          {
            command: "artifacts.server.install",
            configPath: installed.configPath,
            baseUrl: installed.baseUrl,
            host: installed.host,
            port: installed.port,
            dataDir: installed.dataDir,
            repoRoot: installed.repoRoot,
            unit: installed.unit,
            started: false,
            tokenCreated: installed.tokenCreated,
            tokenRotated: installed.tokenRotated,
          },
          installStderr(installed),
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

  server
    .command("setup-nginx")
    .description("Install the :80 reverse proxy without changing /teaching/")
    .action(async () => {
      await runArtifactsCommand(ctx, async () => {
        const applied = await setupNginxArtifacts({ env: ctx.env });
        return succeed(
          {
            command: "artifacts.server.setup-nginx",
            ...applied,
          },
          [
            "nginx reverse-proxy installed (idempotent).",
            "/health, POST /artifacts, /artifacts/… → 127.0.0.1:8787.",
            "/teaching/ is unchanged.",
            "",
          ].join("\n"),
        );
      });
    });
}
