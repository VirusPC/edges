import path from "node:path";
import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { NoteNode } from "../../domain/models/notes/note-node.js";
import { buildSystemForest } from "../../services/node/system-forest-service.js";
import { presentListed } from "../../services/list-query.js";
import { collectRepeat } from "../metadata.js";
import { succeed } from "../result.js";
import { failNote, noteService } from "./node.js";

export function addNoteListCommand(note: Command, ctx: CliContext): void {
  note
    .command("list")
    .description("List notes reached from the subject system")
    .option("--filter <field=value>", "Repeatable field filter", collectRepeat, [])
    .option("--group-by <field>", "Group filtered notes by one field")
    .action(async (opts: { filter?: string[]; groupBy?: string }) => {
      try {
        const { scope, service } = noteService(ctx);
        const nodes = ctx.all
          ? (await buildSystemForest(scope, { includeSuper: ctx.super === true, form: "independent" })).flat()
          : await service
            .query(scope, { types: ["note"], ...(ctx.super ? { super: true as const } : {}) })
            .value();
        const items = nodes.flatMap((node) => {
          if (!(node instanceof NoteNode)) return [];
          const rel = path.relative(scope, node.path).split(path.sep).join("/");
          return [{ stem: path.basename(path.dirname(node.path)), path: rel, title: node.title }];
        });
        ctx.result = succeed(presentListed("notes.list", items, opts));
      } catch (error) {
        failNote(ctx, error);
      }
    });
}
