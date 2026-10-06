import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { fail } from "../result.js";

function hint(ctx: CliContext, verb: "create" | "update"): void {
  ctx.result = fail(
    "VALIDATION_ERROR",
    `edges memory ${verb} does not write. Run: edges memory remember`,
    "See edges memory --help for usage.\n",
  );
}

export function addMemoryCreateCommand(memory: Command, ctx: CliContext): void {
  memory
    .command("create")
    .description("Point at remember. Does not write a memory entry")
    .action(() => hint(ctx, "create"));
}

export function addMemoryUpdateCommand(memory: Command, ctx: CliContext): void {
  memory
    .command("update")
    .description("Point at remember. Does not write a memory entry")
    .action(() => hint(ctx, "update"));
}
