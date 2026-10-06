import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { listNotes } from "../../services/note/records.js";
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

export function addNoteListCommand(note: Command, ctx: CliContext): void {
  note.command("list").description("List note entries under notes/").action(() => {
    try {
      ctx.result = succeed({ command: "note.list", items: listNotes(resolveScope(ctx.env)) });
    } catch (error) {
      failNote(ctx, error);
    }
  });
}
