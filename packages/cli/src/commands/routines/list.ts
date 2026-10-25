import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { listRoutines, presentListed } from "../../services/routines/service.js";
import { collectRepeat } from "../metadata.js";
import { failNodeCommand } from "../node-result.js";
import { succeed } from "../result.js";

const HELP = "See edges routines --help for usage.\n";

export function addRoutineListCommand(routine: Command, ctx: CliContext): void {
  routine
    .command("list")
    .description("List routines reached by scope traversal")
    .option("--filter <field=value>", "Repeatable field filter", collectRepeat, [])
    .option("--group-by <field>", "Group filtered routines by one field")
    .action(async (opts: { filter?: string[]; groupBy?: string }) => {
      try {
        const items = await listRoutines(ctx.env, { all: ctx.all, super: ctx.super, exclude: ctx.exclude });
        ctx.result = succeed(presentListed("routines.list", items, opts));
      } catch (error) {
        failNodeCommand(ctx, error, HELP);
      }
    });
}
