import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { fail } from "../result.js";

export function addMemoryCreateCommand(memory: Command, ctx: CliContext): void {
  memory
    .command("create")
    .description("Point at remember. Does not write a memory entry")
    .action(() => {
      ctx.result = fail(
        "VALIDATION_ERROR",
        "edges memory create does not write. Run: edges memory remember",
        "See edges memory --help for usage.\n",
      );
    });
}
