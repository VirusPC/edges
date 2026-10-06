import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { getMemoryEntry } from "../../services/memory/records.js";
import { present, scoped, target, type TargetOptions } from "./utils/command.js";

export function addMemoryGetCommand(memory: Command, ctx: CliContext): void {
  scoped(
    memory
      .command("get")
      .description("Read one memory entry")
      .requiredOption("--type <type>", "Memory type")
      .requiredOption("--slug <slug>", "Entry slug"),
  ).action((opts: TargetOptions & { type: string; slug: string }) =>
    present(ctx, async () => ({ command: "memory.get", ...(await getMemoryEntry(target(opts, ctx), opts.type, opts.slug)) })),
  );
}
