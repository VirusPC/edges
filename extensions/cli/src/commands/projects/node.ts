import path from "node:path";
import type { CliContext } from "../../context.js";
import { isLeafEntryName } from "../../domain/models/layout.js";
import { ProjectNode } from "../../domain/models/projects/project-node.js";
import { NodeService } from "../../services/node/node-service.js";
import { gitRoot, resolveScope } from "../../services/scope.js";
import { isWithinPath } from "../../utils/filesystem.js";
import { fail } from "../result.js";

export function failProject(ctx: CliContext, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  const validation = /not found|must be|ambiguous|already exists|filter must be|metadata must be|owning scope/.test(message);
  ctx.result = fail(
    validation ? "VALIDATION_ERROR" : "UNKNOWN_ERROR",
    message,
    "See edges projects --help for usage.\n",
  );
}

export function projectService(ctx: CliContext): { scope: string; service: NodeService } {
  const scope = resolveScope(ctx.env);
  const managed = gitRoot(scope) ?? scope;
  return { scope, service: new NodeService({ managedRoot: managed }) };
}

export function relPath(scope: string, file: string): string {
  return path.relative(scope, file).split(path.sep).join("/");
}

export function projectFile(scope: string, entryPath: string): string {
  const abs = path.resolve(scope, entryPath);
  const rel = path.relative(scope, abs);
  const posix = rel.split(path.sep).join("/");
  if (
    rel.startsWith("..") ||
    path.isAbsolute(rel) ||
    !isWithinPath(abs, scope) ||
    !posix.startsWith("projects/") ||
    !isLeafEntryName(path.basename(abs))
  ) {
    throw new Error("project path must be projects/<stem>/INDEX.md");
  }
  return abs;
}

export async function loadProject(ctx: CliContext, entryPath: string): Promise<{
  scope: string;
  service: NodeService;
  node: ProjectNode;
  file: string;
}> {
  const { scope, service } = projectService(ctx);
  const file = projectFile(scope, entryPath);
  const node = await service.get(file, ProjectNode);
  if (!node) throw new Error(`project not found: ${entryPath}`);
  return { scope, service, node, file };
}
