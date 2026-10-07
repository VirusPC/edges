import path from "node:path";
import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { NoteNode } from "../../domain/models/notes/note-node.js";
import { resolveScope, gitRoot } from "../../services/scope.js";
import { NodeService } from "../../services/node/node-service.js";
import { buildSystemForest } from "../../services/node/system-forest-service.js";
import { fail, succeed } from "../result.js";

function failNote(ctx: CliContext, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  ctx.result = fail(
    message.includes("not found") || message.includes("must be") ? "VALIDATION_ERROR" : "UNKNOWN_ERROR",
    message,
    "See edges notes --help for usage.\n",
  );
}

export function addNoteListCommand(note: Command, ctx: CliContext): void {
  note.command("list").description("List notes reached from the subject system").action(async () => {
    try {
      const scope = resolveScope(ctx.env);
      const managed = gitRoot(scope) ?? scope;
      const nodes = ctx.all
        ? (await buildSystemForest(scope, { includeSuper: ctx.super === true, form: "independent" })).flat()
        : await new NodeService({ managedRoot: managed })
          .query(scope, { types: ["note"], ...(ctx.super ? { super: true as const } : {}) })
          .value();
      const items = nodes.flatMap((node) => {
        if (!(node instanceof NoteNode)) return [];
        const rel = path.relative(scope, node.path).split(path.sep).join("/");
        return [{ stem: path.basename(path.dirname(node.path)), path: rel }];
      });
      ctx.result = succeed({ command: "notes.list", items });
    } catch (error) {
      failNote(ctx, error);
    }
  });
}
