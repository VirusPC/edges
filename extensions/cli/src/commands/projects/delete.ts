import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { deleteProject } from "../../services/projects/service.js";
import { failNodeCommand } from "../node-result.js";
import { succeed } from "../result.js";

const HELP = "See edges projects --help for usage.\n";

export function addProjectDeleteCommand(project: Command, ctx: CliContext): void {
  project
    .command("delete")
    .description("Delete one project leaf")
    .argument("<path>", "projects/<stem>/INDEX.md")
    .action(async (entryPath: string) => {
      try {
        const removed = await deleteProject(ctx.env, entryPath);
        ctx.result = succeed({ command: "projects.delete", path: removed.path });
      } catch (error) {
        failNodeCommand(ctx, error, HELP);
      }
    });
}
