import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { fail, succeed } from "../result.js";
import { deleteMemoryEntry, getMemoryEntry, listMemoryEntries } from "../../services/memory/records.js";
import { scoped, target, type TargetOptions } from "./utils/command.js";

const HINT = "See edges memory --help for usage.\n";

function finish(ctx: CliContext, run: () => Promise<Record<string, unknown>>) {
  return run()
    .then((payload) => {
      ctx.result = succeed(payload);
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      ctx.result = fail(message.includes("not found") ? "VALIDATION_ERROR" : "UNKNOWN_ERROR", message, HINT);
    });
}

export function addMemoryListCommand(memory: Command, ctx: CliContext): void {
  scoped(memory.command("list").description("List memory entries").option("--type <type>", "Memory type"))
    .action((opts: TargetOptions & { type?: string }) =>
      finish(ctx, async () => ({ command: "memory.list", ...(await listMemoryEntries(target(opts, ctx), opts.type)) })),
    );
}

export function addMemoryGetCommand(memory: Command, ctx: CliContext): void {
  scoped(
    memory
      .command("get")
      .description("Read one memory entry")
      .requiredOption("--type <type>", "Memory type")
      .requiredOption("--slug <slug>", "Entry slug"),
  ).action((opts: TargetOptions & { type: string; slug: string }) =>
    finish(ctx, async () => ({ command: "memory.get", ...(await getMemoryEntry(target(opts, ctx), opts.type, opts.slug)) })),
  );
}

export function addMemoryDeleteCommand(memory: Command, ctx: CliContext): void {
  scoped(
    memory
      .command("delete")
      .description("Delete one memory entry directory")
      .requiredOption("--type <type>", "Memory type")
      .requiredOption("--slug <slug>", "Entry slug"),
  ).action((opts: TargetOptions & { type: string; slug: string }) =>
    finish(ctx, async () => ({ command: "memory.delete", ...(await deleteMemoryEntry(target(opts, ctx), opts.type, opts.slug)) })),
  );
}
