import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { createRoutine } from "../../services/routines/service.js";
import { collectRepeat } from "../metadata.js";
import { failNodeCommand } from "../node-result.js";
import { succeed } from "../result.js";

const HELP = "See edges routines --help for usage.\n";

export function addRoutineCreateCommand(routine: Command, ctx: CliContext): void {
  routine
    .command("create")
    .description("Create a routine INDEX.md")
    .argument("<name>", "kebab-case routine name")
    .requiredOption("--description <text>", "Routine description")
    .option("--body <markdown>", "Routine body")
    .option("--metadata <key=value>", "Repeatable frontmatter field", collectRepeat, [])
    .action(async (name: string, opts: { description: string; body?: string; metadata?: string[] }) => {
      try {
        const created = await createRoutine(ctx.env, {
          name,
          description: opts.description,
          body: opts.body,
          metadata: opts.metadata,
          super: ctx.super === true,
        });
        ctx.result = succeed({
          command: "routines.create",
          name: created.name,
          path: created.path,
        });
      } catch (error) {
        failNodeCommand(ctx, error, HELP);
      }
    });
}
