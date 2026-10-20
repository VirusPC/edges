import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { updateCompose } from "../../services/compose/service.js";
import { failNodeCommand } from "../node-result.js";
import { COMPOSE_GIT_AFTER_HELP, composeGitResult } from "./git-result.js";

const HELP = "See edges compose --help for usage.\n";

export function addComposeUpdateCommand(compose: Command, ctx: CliContext): void {
  compose
    .command("update")
    .description("git submodule update --init each Compose entry (never --recursive)")
    .option("--name <name>", "Only this entry")
    .option("--remote", "Follow the remote tip (git submodule update --remote)")
    .allowExcessArguments(false)
    .addHelpText("after", COMPOSE_GIT_AFTER_HELP)
    .action(async (opts: { name?: string; remote?: boolean }) => {
      try {
        const { reports, warnings } = await updateCompose(ctx.env, opts);
        ctx.result = composeGitResult("update", reports, HELP, warnings);
      } catch (error) {
        failNodeCommand(ctx, error, HELP);
      }
    });
}
