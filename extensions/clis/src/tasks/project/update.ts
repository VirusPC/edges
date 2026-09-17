import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { updateProject } from "../utils/project-meta.js";
import { runTasksCommand, succeed } from "../utils/result.js";

export function addProjectUpdateCommand(project: Command, ctx: CliContext): void {
  project
    .command("update")
    .description("Update Task Project title or description")
    .argument("<project>", "default or kebab slug")
    .option("--title <title>", "Task Project title")
    .option("--description <text>", "Task Project description")
    .option("--json", "Write JSON to stdout (always on)")
    .action(async (projectId: string, opts: { title?: string; description?: string }) => {
      await runTasksCommand(ctx, async (runtime) => {
        const updated = await updateProject(
          runtime.repoPath,
          projectId,
          { title: opts.title, description: opts.description },
          runtime.writer,
        );
        return succeed({ status: "success", command: "project.update", ...updated });
      });
    });
}
