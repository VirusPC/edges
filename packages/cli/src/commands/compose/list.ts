import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { listCompose } from "../../services/compose/service.js";
import { failNodeCommand } from "../node-result.js";
import { succeed } from "../result.js";
import { presentComposeEntry } from "./present.js";

const HELP = "See edges compose --help for usage.\n";

export function addComposeListCommand(compose: Command, ctx: CliContext): void {
  compose
    .command("list")
    .description("List .harness/compose/README.md entries and whether each is checked out locally")
    .allowExcessArguments(false)
    .action(async () => {
      try {
        const { entries, warnings } = await listCompose(ctx.env);
        ctx.result = succeed({
          command: "compose.list",
          entries: entries.map((entry) => ({ ...presentComposeEntry(entry), href: entry.href, initialized: entry.initialized })),
        }, warnings.join(""));
      } catch (error) {
        failNodeCommand(ctx, error, HELP);
      }
    });
}
