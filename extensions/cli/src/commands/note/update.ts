import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { updateNote } from "../../services/note/records.js";
import { resolveScope } from "../../services/scope.js";
import { fail, succeed } from "../result.js";

function failNote(ctx: CliContext, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  ctx.result = fail(
    message.includes("not found") || message.includes("must be") ? "VALIDATION_ERROR" : "UNKNOWN_ERROR",
    message,
    "See edges note --help for usage.\n",
  );
}

export function addNoteUpdateCommand(note: Command, ctx: CliContext): void {
  note
    .command("update")
    .description("Update a note title or body without git ingest")
    .argument("<path>", "notes/<stem>/index.md")
    .option("--title <title>", "New title")
    .option("--body <markdown>", "New body")
    .action((entryPath: string, opts: { title?: string; body?: string }) => {
      try {
        ctx.result = succeed({
          command: "note.update",
          ...updateNote(resolveScope(ctx.env), entryPath, opts),
        });
      } catch (error) {
        failNote(ctx, error);
      }
    });
}
