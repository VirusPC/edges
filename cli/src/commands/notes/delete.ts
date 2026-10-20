import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { deleteNote } from "../../services/notes/service.js";
import { failNodeCommand } from "../node-result.js";
import { succeed } from "../result.js";

const HELP = "See edges notes --help for usage.\n";

export function addNoteDeleteCommand(note: Command, ctx: CliContext): void {
  note
    .command("delete")
    .description("Delete one note")
    .argument("<path>", "notes/<stem>/INDEX.md")
    .action(async (entryPath: string) => {
      try {
        const removed = await deleteNote(ctx.env, entryPath);
        ctx.result = succeed({ command: "notes.delete", path: removed.path });
      } catch (error) {
        failNodeCommand(ctx, error, HELP);
      }
    });
}
