import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { createProject } from "../utils/project-meta.js";
import { runTasksCommand, succeed } from "../utils/result.js";

export function addProjectCreateCommand(project: Command, ctx: CliContext): void {
  project
    .command("create")
    .description("Create Task Project metadata")
    .argument("<project>", "default or kebab slug")
    .requiredOption("--title <title>", "Task Project title")
    .requiredOption("--description <text>", "Task Project description")
    .option("--json", "Write JSON to stdout (always on)")
    .action(async (projectId: string, opts: { title: string; description: string }) => {
      await runTasksCommand(ctx, async (runtime) => {
        const created = await createProject(
          runtime.repoPath,
          { project: projectId, title: opts.title, description: opts.description },
          runtime.writer,
        );
        return succeed({ status: "success", command: "project.create", ...created });
      });
    });
}
