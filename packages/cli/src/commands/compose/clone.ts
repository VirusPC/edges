import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { cloneCompose } from "../../services/compose/service.js";
import { failNodeCommand } from "../node-result.js";
import { COMPOSE_GIT_AFTER_HELP, composeGitResult } from "./git-result.js";

const HELP = "See edges compose --help for usage.\n";

export function addComposeCloneCommand(compose: Command, ctx: CliContext): void {
  compose
    .command("clone")
    .description("Initialize Compose entries (git submodule update --init, never --recursive)")
    .option("--name <name>", "Only this entry")
    .allowExcessArguments(false)
    .addHelpText("after", COMPOSE_GIT_AFTER_HELP)
    .action(async (opts: { name?: string }) => {
      try {
        const { reports, warnings } = await cloneCompose(ctx.env, opts.name);
        ctx.result = composeGitResult("clone", reports, HELP, warnings);
      } catch (error) {
        failNodeCommand(ctx, error, HELP);
      }
    });
}
