import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { getRoutine } from "../../services/routines/service.js";
import { failNodeCommand } from "../node-result.js";
import { succeed } from "../result.js";

const HELP = "See edges routines --help for usage.\n";

export function addRoutineGetCommand(routine: Command, ctx: CliContext): void {
  routine
    .command("get")
    .description("Read one routine by path or name")
    .argument("<target>", "INDEX.md path or routine name")
    .action(async (target: string) => {
      try {
        const loaded = await getRoutine(ctx.env, target, { all: ctx.all, super: ctx.super, exclude: ctx.exclude });
        ctx.result = succeed({
          command: "routines.get",
          name: loaded.name,
          path: loaded.path,
          description: loaded.description,
          body: loaded.body,
          metadata: loaded.metadata,
        });
      } catch (error) {
        failNodeCommand(ctx, error, HELP);
      }
    });
}
