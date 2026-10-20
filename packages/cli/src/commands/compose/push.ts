import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { pushCompose } from "../../services/compose/service.js";
import { failNodeCommand } from "../node-result.js";
import { COMPOSE_GIT_AFTER_HELP, composeGitResult } from "./git-result.js";

const HELP = "See edges compose --help for usage.\n";

export function addComposePushCommand(compose: Command, ctx: CliContext): void {
  compose
    .command("push")
    .description("git push inside each composed checkout (submodule must be on a branch)")
    .option("--name <name>", "Only this entry")
    .allowExcessArguments(false)
    .addHelpText("after", COMPOSE_GIT_AFTER_HELP)
    .action(async (opts: { name?: string }) => {
      try {
        const { reports, warnings } = await pushCompose(ctx.env, opts.name);
        ctx.result = composeGitResult("push", reports, HELP, warnings);
      } catch (error) {
        failNodeCommand(ctx, error, HELP);
      }
    });
}
