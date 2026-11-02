import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { deleteProject } from "../../services/projects/service.js";
import { failNodeCommand } from "../node-result.js";
import { succeed } from "../result.js";

const HELP = "See edges projects --help for usage.\n";

export function addProjectDeleteCommand(project: Command, ctx: CliContext): void {
  project
    .command("delete")
    .description("Delete one project container")
    .argument("<path>", ".edges/projects/<stem>/INDEX.md (--super: projects/<stem>/INDEX.md)")
    .option("--recursive", "Delete the Project directory including child materials and resources")
    .action(async (entryPath: string, opts: { recursive?: boolean }) => {
      try {
        const removed = await deleteProject(ctx.env, entryPath, { super: ctx.super, project: ctx.project, recursive: opts.recursive });
        ctx.result = succeed({ command: "projects.delete", path: removed.path });
      } catch (error) {
        failNodeCommand(ctx, error, HELP);
      }
    });
}
