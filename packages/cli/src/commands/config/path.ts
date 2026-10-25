import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { EdgesConfigError, resolveEdgesConfigPath } from "../../services/config/service.js";
import { fail, succeed } from "../result.js";

const HELP = "See edges config --help for usage.\n";

export function addConfigPathCommand(config: Command, ctx: CliContext): void {
  config
    .command("path")
    .description("Print the unified edges.env path. The file does not need to exist.")
    .option("--config <path>", "Config path override")
    .allowExcessArguments(false)
    .action((opts: { config?: string }) => {
      try {
        const configPath = resolveEdgesConfigPath(ctx.env, opts.config);
        ctx.result = succeed({ command: "config.path", path: configPath });
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
