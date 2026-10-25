import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { EvaluationError } from "../../services/evaluation/error.js";
import {
  installEvaluationServer,
  restartEvaluationServer,
  startEvaluationServer,
  statusEvaluationServer,
  stopEvaluationServer,
} from "../../services/evaluation/server/ops.js";
import { fail, succeed } from "../result.js";

const SERVER_AFTER_HELP = `
COMMANDS
  install [--config <path>]
    Require ~/.config/edges/edges.env (edges config init). Fill default
    EXPERIMENT_WEBHOOK_HOST / PORT when those keys are absent. Install and
    enable the user unit. Does not start.
  start [--dev] [--config <path>]
    Default: systemctl --user start, then GET /health.
    --dev: foreground python3 -m experiment_webhook until it exits.
  stop | restart
    Process lifecycle only (systemctl --user).
  status
    User unit + curl 127.0.0.1:<port>/health

Never combine install and start.
The server reads ~/.config/edges/edges.env only. It does not read
~/.config/edges/artifacts-preview.env. If the new file is missing:
  edges config init

First time:
  edges config init
  edges evaluation server install
  edges evaluation server start
  edges evaluation server status

Foreground on this machine:
  edges evaluation server start --dev
`;

const HELP = "See edges evaluation server --help for usage.\n";

async function runEvaluation(ctx: CliContext, fn: () => Promise<ReturnType<typeof succeed>>): Promise<void> {
  try {
    ctx.result = await fn();
  } catch (error) {
    if (error instanceof EvaluationError) {
      ctx.result = fail(error.errorCode, error.message, HELP);
      return;
    }
    const message = error instanceof Error ? error.message : String(error);
    ctx.result = fail("UNKNOWN_ERROR", message, HELP);
  }
}

export function addEvaluationServerCommand(evaluation: Command, ctx: CliContext): void {
  const server = evaluation
    .command("server")
    .description("Run the evaluation HTTP process (Experiment Webhook) on this machine")
    .allowExcessArguments(false)
    .showHelpAfterError(false)
    .helpOption("-h, --help", "Show this help")
    .addHelpText("after", SERVER_AFTER_HELP);

  server.action(() => {
    ctx.result = fail(
      "VALIDATION_ERROR",
      "missing evaluation server subcommand. Use edges evaluation server --help.",
      HELP,
    );
  });

  server
    .command("install")
    .description("Require edges.env, install and enable the user unit. Does not start.")
    .option("--config <path>", "Unified env path (default: ~/.config/edges/edges.env)")
    .action(async (opts: { config?: string }) => {
      await runEvaluation(ctx, async () => {
        const installed = await installEvaluationServer({ env: ctx.env, configPath: opts.config });
        return succeed(
          {
            command: "evaluation.server.install",
            configPath: installed.configPath,
            host: installed.host,
            port: installed.port,
            repoRoot: installed.repoRoot,
            serviceDir: installed.serviceDir,
            unit: installed.unit,
            started: false,
          },
          "Unit installed and enabled. Not started.\nNext: edges evaluation server start\n",
        );
      });
    });

  server
    .command("start")
    .description("Start the user systemd unit, or run in the foreground with --dev")
    .option("--dev", "Foreground blocking process. Default start uses the user unit.")
    .option("--config <path>", "Unified env path")
    .action(async (opts: { dev?: boolean; config?: string }) => {
      await runEvaluation(ctx, async () => {
        const started = await startEvaluationServer({
          env: ctx.env,
          configPath: opts.config,
          dev: opts.dev,
        });
        return succeed({ command: "evaluation.server.start", ...started });
      });
    });

  server
    .command("stop")
    .description("Stop the user systemd unit")
    .action(async () => {
      await runEvaluation(ctx, async () => {
        const stopped = await stopEvaluationServer({ env: ctx.env });
        return succeed({ command: "evaluation.server.stop", ...stopped });
      });
    });

  server
    .command("restart")
    .description("Restart the user systemd unit")
    .option("--config <path>", "Unified env path")
    .action(async (opts: { config?: string }) => {
      await runEvaluation(ctx, async () => {
        const restarted = await restartEvaluationServer({ env: ctx.env, configPath: opts.config });
        return succeed({ command: "evaluation.server.restart", ...restarted });
      });
    });

  server
    .command("status")
    .description("Show /health and systemctl --user status")
    .option("--config <path>", "Unified env path")
    .action(async (opts: { config?: string }) => {
      await runEvaluation(ctx, async () => {
        const status = await statusEvaluationServer({ env: ctx.env, configPath: opts.config });
        const result = succeed({ command: "evaluation.server.status", ...status });
        if (!status.healthy) {
          return { ...result, exitCode: 1 };
        }
        return result;
      });
    });
}
