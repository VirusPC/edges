import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { succeed } from "../result.js";
import { failNote, loadNote, relPath } from "./node.js";

export function addNoteGetCommand(note: Command, ctx: CliContext): void {
  note
    .command("get")
    .description("Read one note")
    .argument("<path>", "notes/<stem>/INDEX.md")
    .action(async (entryPath: string) => {
      try {
        const { scope, node, file } = await loadNote(ctx, entryPath);
        ctx.result = succeed({
          command: "notes.get",
          path: relPath(scope, file),
          title: node.title,
          body: node.body,
        });
      } catch (error) {
        failNote(ctx, error);
      }
    });
}
