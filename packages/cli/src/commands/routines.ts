import { Command } from "commander";
import { type CliContext, usageError } from "../context.js";
import { addRoutineCreateCommand } from "./routines/create.js";
import { addRoutineDeleteCommand } from "./routines/delete.js";
import { addRoutineGetCommand } from "./routines/get.js";
import { addRoutineInitCommand } from "./routines/init.js";
import { addRoutineListCommand } from "./routines/list.js";
import { addRoutineUpdateCommand } from "./routines/update.js";

export function addRoutinesCommand(program: Command, ctx: CliContext): void {
  const routines = program
    .command("routines")
    .description("Routine definitions. Scheduling and execution belong to external platforms.");
  routines.action(() => {
    ctx.result = usageError("missing routines command. Use edges routines --help.", "routines");
  });
  addRoutineListCommand(routines, ctx);
  addRoutineGetCommand(routines, ctx);
  addRoutineCreateCommand(routines, ctx);
  addRoutineUpdateCommand(routines, ctx);
  addRoutineDeleteCommand(routines, ctx);
  addRoutineInitCommand(routines, ctx);
}
