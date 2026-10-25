import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { EdgesConfigError, initEdgesConfig } from "../../services/config/edges-env.js";
import { fail, succeed } from "../result.js";

const HELP = "See edges config --help for usage.\n";

export function addConfigInitCommand(config: Command, ctx: CliContext): void {
  config
    .command("init")
    .description("Create ~/.config/edges/edges.env. Copy artifacts-preview.env once when it exists.")
    .option("--config <path>", "Config path (default: ~/.config/edges/edges.env)")
    .allowExcessArguments(false)
    .action(async (opts: { config?: string }) => {
      try {
        const created = await initEdgesConfig({ env: ctx.env, configPath: opts.config });
        ctx.result = succeed(
          {
            command: "config.init",
            path: created.path,
            created: created.created,
            migrated: created.migrated,
          },
          created.stderr,
        );
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
