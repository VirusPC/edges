import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { getDatedLeaf, NOTE_LEAF } from "../../services/node/dated-leaf.js";
import { failNodeCommand } from "../node-result.js";
import { succeed } from "../result.js";

const HELP = "See edges notes --help for usage.\n";

export function addNoteGetCommand(note: Command, ctx: CliContext): void {
  note
    .command("get")
    .description("Read one note")
    .argument("<path>", "notes/<stem>/INDEX.md")
    .action(async (entryPath: string) => {
      try {
        const loaded = await getDatedLeaf(ctx.env, NOTE_LEAF, entryPath);
        ctx.result = succeed({
          command: "notes.get",
          path: loaded.path,
          title: loaded.title,
          body: loaded.body,
        });
      } catch (error) {
        failNodeCommand(ctx, error, HELP);
      }
    });
}
