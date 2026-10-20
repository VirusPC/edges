import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { deleteMemoryEntry } from "../../services/memory/service.js";
import { present, scoped, target, type TargetOptions } from "./utils/command.js";

export function addMemoryDeleteCommand(memory: Command, ctx: CliContext): void {
  scoped(
    memory
      .command("delete")
      .description("Delete one memory entry directory")
      .requiredOption("--type <type>", "Memory type")
      .requiredOption("--slug <slug>", "Entry slug"),
  ).action((opts: TargetOptions & { type: string; slug: string }) =>
    present(ctx, async () => ({ command: "memory.delete", ...(await deleteMemoryEntry(target(opts, ctx), opts.type, opts.slug)) })),
  );
}
