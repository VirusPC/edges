import path from "node:path";
import { Command } from "commander";
import type { CliContext } from "../../../context.js";
import { ReadmeNode } from "../../../domain/models/readme/readme-node.js";
import { runTasksCommand, succeed } from "../run.js";
import { gitRoot } from "../../../services/scope.js";
import { NodeService } from "../../../services/node/node-service.js";
import { buildSystemForest } from "../../../services/node/system-forest-service.js";

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
          const at = parts.lastIndexOf("tasks");
          if (at < 0 || parts[at + 1] === undefined || path.basename(node.path) !== "README.md") return [];
          if (path.basename(path.dirname(node.path)) === "tasks") return [];
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
