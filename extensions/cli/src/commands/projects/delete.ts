import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { succeed } from "../result.js";
import { failProject, loadProject, relPath } from "./node.js";

export function addProjectDeleteCommand(project: Command, ctx: CliContext): void {
  project
    .command("delete")
    .description("Delete one project leaf")
    .argument("<path>", "projects/<stem>/INDEX.md")
    .action(async (entryPath: string) => {
      try {
        const { scope, service, node, file } = await loadProject(ctx, entryPath);
        await service.destroy(node);
        ctx.result = succeed({ command: "projects.delete", path: relPath(scope, file) });
      } catch (error) {
        failProject(ctx, error);
      }
    });
}
