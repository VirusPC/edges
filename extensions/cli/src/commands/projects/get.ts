import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { succeed } from "../result.js";
import { failProject, loadProject, relPath } from "./node.js";

export function addProjectGetCommand(project: Command, ctx: CliContext): void {
  project
    .command("get")
    .description("Read one project leaf")
    .argument("<path>", "projects/<stem>/INDEX.md")
    .action(async (entryPath: string) => {
      try {
        const { scope, node, file } = await loadProject(ctx, entryPath);
        ctx.result = succeed({
          command: "projects.get",
          path: relPath(scope, file),
          title: node.title,
          body: node.body,
        });
      } catch (error) {
        failProject(ctx, error);
      }
    });
}
