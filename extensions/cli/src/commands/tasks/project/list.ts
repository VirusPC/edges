import path from "node:path";
import { Command } from "commander";
import type { CliContext } from "../../../context.js";
import { ReadmeNode } from "../../../domain/models/readme/readme-node.js";
import { runTasksCommand, succeed } from "../run.js";
import { harnessMaterialById, tasksBoardDirName } from "../../../domain/config/harness-materials.js";
import { ENTRY_NAMES } from "../../../domain/models/layout.js";
import { buildSystemForest, gitRoot, NodeService } from "../../../services/tasks/service.js";

export function addProjectListCommand(project: Command, ctx: CliContext): void {
  project
    .command("list")
    .description("List Task Project metadata")
    .option("--json", "Write JSON to stdout (always on)")
    .action(async () => {
      await runTasksCommand(ctx, async (runtime) => {
        const scopeDir = runtime.location.scopeDir;
        const managed = gitRoot(scopeDir) ?? scopeDir;
        const nodes = ctx.all
          ? (await buildSystemForest(scopeDir, { includeSuper: ctx.super === true, form: "independent" })).flat()
          : await new NodeService({ managedRoot: managed })
            .query(scopeDir, { types: ["readme"], ...(ctx.super ? { super: true as const } : {}) })
            .value();
        const projects = nodes.flatMap((node) => {
          if (!(node instanceof ReadmeNode)) return [];
          const rel = path.relative(scopeDir, node.path).split(path.sep).join("/");
          const parts = rel.split("/");
          const board = tasksBoardDirName();
          const at = parts.lastIndexOf(board);
          const materialName = path.basename(harnessMaterialById("tasks").path);
          if (at < 0 || parts[at + 1] === undefined || path.basename(node.path) !== ENTRY_NAMES.readme) return [];
          if (path.basename(path.dirname(node.path)) === board && path.basename(node.path) === materialName) return [];
          const dir = path.basename(path.dirname(node.path));
          return [{
            project: dir === "_default" ? "default" : dir,
            title: node.name,
            description: node.description,
            path: rel,
          }];
        });
        return succeed({ status: "success", command: "project.list", projects });
      });
    });
}
