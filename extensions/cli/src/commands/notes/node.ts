import path from "node:path";
import type { CliContext } from "../../context.js";
import { isLeafEntryName } from "../../domain/models/layout.js";
import { NoteNode } from "../../domain/models/notes/note-node.js";
import { NodeService } from "../../services/node/node-service.js";
import { gitRoot, resolveScope } from "../../services/scope.js";
import { isWithinPath } from "../../utils/filesystem.js";
import { fail } from "../result.js";

export function failNote(ctx: CliContext, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  const validation = /not found|must be|ambiguous|already exists|filter must be|metadata must be|owning scope/.test(message);
  ctx.result = fail(
    validation ? "VALIDATION_ERROR" : "UNKNOWN_ERROR",
    message,
    "See edges notes --help for usage.\n",
  );
}

export function noteService(ctx: CliContext): { scope: string; service: NodeService } {
  const scope = resolveScope(ctx.env);
  const managed = gitRoot(scope) ?? scope;
  return { scope, service: new NodeService({ managedRoot: managed }) };
}

export function relPath(scope: string, file: string): string {
  return path.relative(scope, file).split(path.sep).join("/");
}

export function noteFile(scope: string, entryPath: string): string {
  const abs = path.resolve(scope, entryPath);
  const rel = path.relative(scope, abs);
  const posix = rel.split(path.sep).join("/");
  if (
    rel.startsWith("..") ||
    path.isAbsolute(rel) ||
    !isWithinPath(abs, scope) ||
    !posix.startsWith("notes/") ||
    !isLeafEntryName(path.basename(abs))
  ) {
    throw new Error("note path must be notes/<stem>/INDEX.md");
  }
  return abs;
}

export async function loadNote(ctx: CliContext, entryPath: string): Promise<{
  scope: string;
  service: NodeService;
  node: NoteNode;
  file: string;
}> {
  const { scope, service } = noteService(ctx);
  const file = noteFile(scope, entryPath);
  const node = await service.get(file, NoteNode);
  if (!node) throw new Error(`note not found: ${entryPath}`);
  return { scope, service, node, file };
}
