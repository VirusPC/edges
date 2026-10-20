import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { addCompose } from "../../services/compose/service.js";
import { failNodeCommand } from "../node-result.js";
import { fail, succeed } from "../result.js";
import { presentComposeEntry } from "./present.js";

const HELP = "See edges compose --help for usage.\n";
const DESCRIPTION_REQUIRED = "--description is required";

export function addComposeAddCommand(compose: Command, ctx: CliContext): void {
  compose
    .command("add")
    .description("git submodule add a repository and record it in the scope Compose block")
    .requiredOption("--name <name>", "Entry name")
    .option("--path <directory>", "Checkout directory relative to the scope AGENTS.md (default: .harness/compose/<name>; absolute and ~ paths are rejected)")
    .option("--remote <url>", "Git remote; inside a git repo this runs git submodule add <url> <path>")
    .requiredOption("--description <text>", "Required. What this repository stores and when to write into it")
    .allowExcessArguments(false)
    .action(async (opts: {
      name: string;
      path?: string;
      remote?: string;
      description: string;
    }) => {
      const description = opts.description.trim();
      if (!description) {
        ctx.result = fail("VALIDATION_ERROR", DESCRIPTION_REQUIRED, HELP);
        return;
      }
      try {
        const { entry, submodule, warnings } = await addCompose(ctx.env, {
          name: opts.name,
          directory: opts.path,
          remote: opts.remote,
          description,
        });
        ctx.result = succeed({
          command: "compose.add",
          ...presentComposeEntry(entry),
          href: entry.href,
          ...(submodule === undefined ? {} : { submodule }),
        }, warnings.join(""));
      } catch (error) {
        failNodeCommand(ctx, error, HELP);
      }
    });
}
