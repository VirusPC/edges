import path from "node:path";
import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { ProjectNode } from "../../domain/models/projects/project-node.js";
import { buildSystemForest } from "../../services/node/system-forest-service.js";
import { presentListed } from "../../services/list-query.js";
import { collectRepeat } from "../metadata.js";
import { succeed } from "../result.js";
import { failProject, projectService } from "./node.js";

export function addProjectListCommand(project: Command, ctx: CliContext): void {
  project
    .command("list")
    .description("List projects reached from the subject system")
    .option("--filter <field=value>", "Repeatable field filter", collectRepeat, [])
    .option("--group-by <field>", "Group filtered projects by one field")
    .action(async (opts: { filter?: string[]; groupBy?: string }) => {
      try {
        const { scope, service } = projectService(ctx);
        const nodes = ctx.all
          ? (await buildSystemForest(scope, { includeSuper: ctx.super === true, form: "independent" })).flat()
          : await service
            .query(scope, { types: ["project"], ...(ctx.super ? { super: true as const } : {}) })
            .value();
        const items = nodes.flatMap((node) => {
          if (!(node instanceof ProjectNode)) return [];
          const rel = path.relative(scope, node.path).split(path.sep).join("/");
          return [{ stem: path.basename(path.dirname(node.path)), path: rel, title: node.title }];
        });
        ctx.result = succeed(presentListed("projects.list", items, opts));
      } catch (error) {
        failProject(ctx, error);
      }
    });
}
