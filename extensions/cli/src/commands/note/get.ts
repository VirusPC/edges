import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { getNote } from "../../services/note/records.js";
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

export function addNoteGetCommand(note: Command, ctx: CliContext): void {
  note
    .command("get")
    .description("Read one note")
    .argument("<path>", "notes/<stem>/index.md")
    .action((entryPath: string) => {
      try {
        ctx.result = succeed({ command: "note.get", ...getNote(resolveScope(ctx.env), entryPath) });
      } catch (error) {
        failNote(ctx, error);
      }
    });
}
