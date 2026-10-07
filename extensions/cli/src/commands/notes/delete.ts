import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { succeed } from "../result.js";
import { failNote, loadNote, relPath } from "./node.js";

export function addNoteDeleteCommand(note: Command, ctx: CliContext): void {
  note
    .command("delete")
    .description("Delete one note")
    .argument("<path>", "notes/<stem>/INDEX.md")
    .action(async (entryPath: string) => {
      try {
        const { scope, service, node, file } = await loadNote(ctx, entryPath);
        await service.destroy(node);
        ctx.result = succeed({ command: "notes.delete", path: relPath(scope, file) });
      } catch (error) {
        failNote(ctx, error);
      }
    });
}
