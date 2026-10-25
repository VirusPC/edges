import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { EdgesConfigError, showEdgesConfig } from "../../services/config/service.js";
import { fail, succeed } from "../result.js";

const HELP = "See edges config --help for usage.\n";

export function addConfigShowCommand(config: Command, ctx: CliContext): void {
  config
    .command("show")
    .description("Print edges.env with secret values redacted")
    .option("--config <path>", "Config path override")
    .allowExcessArguments(false)
    .action(async (opts: { config?: string }) => {
      try {
        const shown = await showEdgesConfig({ env: ctx.env, configPath: opts.config });
        ctx.result = succeed({
          command: "config.show",
          path: shown.path,
          values: shown.values,
        });
      } catch (error) {
        if (error instanceof EdgesConfigError) {
          ctx.result = fail(error.errorCode, error.message, HELP);
          return;
        }
        const message = error instanceof Error ? error.message : String(error);
        ctx.result = fail("UNKNOWN_ERROR", message, HELP);
      }
    });
}
