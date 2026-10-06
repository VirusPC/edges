import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { fail } from "../result.js";

export function addMemoryUpdateCommand(memory: Command, ctx: CliContext): void {
  memory
    .command("update")
    .description("Point at remember. Does not write a memory entry")
    .action(() => {
      ctx.result = fail(
        "VALIDATION_ERROR",
        "edges memory update does not write. Run: edges memory remember",
        "See edges memory --help for usage.\n",
      );
    });
}
