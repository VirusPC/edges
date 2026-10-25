import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { deleteRoutine } from "../../services/routines/service.js";
import { failNodeCommand } from "../node-result.js";
import { succeed } from "../result.js";

const HELP = "See edges routines --help for usage.\n";

export function addRoutineDeleteCommand(routine: Command, ctx: CliContext): void {
  routine
    .command("delete")
    .description("Delete one routine")
    .argument("<target>", "INDEX.md path or routine name")
    .action(async (target: string) => {
      try {
        const removed = await deleteRoutine(ctx.env, target, { all: ctx.all, super: ctx.super, exclude: ctx.exclude });
        ctx.result = succeed({ command: "routines.delete", path: removed.path });
      } catch (error) {
        failNodeCommand(ctx, error, HELP);
      }
    });
}
