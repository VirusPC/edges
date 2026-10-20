import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { failTask } from "./run.js";

export function addDeleteCommand(tasks: Command, ctx: CliContext): void {
  tasks
    .command("delete")
    .description("Point at status cancelled. Does not delete Task files")
    .argument("<target>", "stem or path")
    .action((target: string) => {
      ctx.result = failTask(
        "VALIDATION_ERROR",
        `edges tasks delete does not delete files. Run: edges tasks status ${target} cancelled`,
      );
    });
}
