import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { updateRoutine } from "../../services/routines/service.js";
import { collectRepeat } from "../metadata.js";
import { failNodeCommand } from "../node-result.js";
import { succeed } from "../result.js";

const HELP = "See edges routines --help for usage.\n";

export function addRoutineUpdateCommand(routine: Command, ctx: CliContext): void {
  routine
    .command("update")
    .description("Update a routine description, body, or metadata")
    .argument("<target>", "INDEX.md path or routine name")
    .option("--description <text>", "New description")
    .option("--body <markdown>", "New body")
    .option("--metadata <key=value>", "Repeatable frontmatter field", collectRepeat, [])
    .action(async (target: string, opts: { description?: string; body?: string; metadata?: string[] }) => {
      try {
        const updated = await updateRoutine(
          ctx.env,
          target,
          {
            description: opts.description,
            body: opts.body,
            metadata: opts.metadata,
          },
          { all: ctx.all, super: ctx.super, exclude: ctx.exclude },
        );
        ctx.result = succeed({
          command: "routines.update",
          name: updated.name,
          path: updated.path,
        });
      } catch (error) {
        failNodeCommand(ctx, error, HELP);
      }
    });
}
