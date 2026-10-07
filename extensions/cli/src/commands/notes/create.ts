import path from "node:path";
import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { NoteNode } from "../../domain/models/notes/note-node.js";
import { localDateYmd } from "../../utils/date.js";
import { collectRepeat, parseMetadata } from "../metadata.js";
import { succeed } from "../result.js";
import { failNote, noteService, relPath } from "./node.js";

function titleSlug(title: string, now: Date): string {
  const slug = title.toLowerCase().replace(/ /g, "-").replace(/[^a-z0-9-]/g, "");
  return slug.length === 0 ? `untitled-${Math.floor(now.getTime() / 1000)}` : slug;
}

function composeNote(anchor: string, title: string | undefined, body: string | undefined): { markdown: string; title: string } {
  if (title !== undefined && (title.length < 1 || title.length > 120)) {
    throw new Error("note title must be 1–120 characters");
  }
  const draft = new NoteNode(anchor);
  draft.body = body ?? "";
  if (title !== undefined) draft.title = title;
  if (!draft.title.trim()) throw new Error("note title must be an H1 or --title");
  if (draft.title.length > 120) throw new Error("note title must be 1–120 characters");
  return { markdown: draft.body, title: draft.title };
}

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
        const { scope, service } = noteService(ctx);
        const metadata = parseMetadata(opts.metadata);
        const composed = composeNote(path.join(scope, "INDEX.md"), opts.title, opts.body);
        const now = new Date();
        const file = path.join(scope, "notes", `${localDateYmd(now)}--${titleSlug(composed.title, now)}`, "INDEX.md");
        const node = new NoteNode(file);
        await service.create(node, {
          body: composed.markdown,
          ...(metadata ? { metadata } : {}),
        });
        ctx.result = succeed({
          command: "notes.create",
          path: relPath(scope, file),
          title: composed.title,
        });
      } catch (error) {
        failNote(ctx, error);
      }
    });
}
