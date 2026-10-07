import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { createDatedLeaf, NOTE_LEAF } from "../../services/node/dated-leaf.js";
import { collectRepeat } from "../metadata.js";
import { failNodeCommand } from "../node-result.js";
import { succeed } from "../result.js";

const HELP = "See edges notes --help for usage.\n";

export function addNoteCreateCommand(note: Command, ctx: CliContext): void {
  note
    .command("create")
    .description("Create a local note leaf")
    .option("--title <title>", "Note title; written as the H1")
    .option("--body <markdown>", "Note body")
    .option("--metadata <key=value>", "Repeatable frontmatter field", collectRepeat, [])
    .option("--json", "Write JSON to stdout (always on)")
    .action(async (opts: { title?: string; body?: string; metadata?: string[] }) => {
      try {
        const created = await createDatedLeaf(ctx.env, NOTE_LEAF, {
          title: opts.title,
          body: opts.body,
          metadata: opts.metadata,
        });
        ctx.result = succeed({
          command: "notes.create",
          path: created.path,
          title: created.title,
        });
      } catch (error) {
        failNodeCommand(ctx, error, HELP);
      }
    });
}
