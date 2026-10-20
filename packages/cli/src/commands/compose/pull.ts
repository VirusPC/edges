import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { pullCompose } from "../../services/compose/service.js";
import { failNodeCommand } from "../node-result.js";
import { COMPOSE_GIT_AFTER_HELP, composeGitResult } from "./git-result.js";

const HELP = "See edges compose --help for usage.\n";

export function addComposePullCommand(compose: Command, ctx: CliContext): void {
  compose
    .command("pull")
    .description("git pull in each composed checkout, using that repo's own config")
    .option("--name <name>", "Only this entry")
    .allowExcessArguments(false)
    .addHelpText("after", COMPOSE_GIT_AFTER_HELP)
    .action(async (opts: { name?: string }) => {
      try {
        const entries = await pullCompose(ctx.env, opts.name);
        ctx.result = composeGitResult("pull", entries, HELP);
      } catch (error) {
        failNodeCommand(ctx, error, HELP);
      }
    });
}
