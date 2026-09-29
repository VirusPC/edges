import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { listProjects } from "../utils/project-meta.js";
import { runTasksCommand, succeed } from "../utils/result.js";

export function addProjectListCommand(project: Command, ctx: CliContext): void {
  project
    .command("list")
    .description("List Task Project metadata")
    .option("--json", "Write JSON to stdout (always on)")
    .action(async () => {
      await runTasksCommand(ctx, async (runtime) => {
        const projects = await listProjects(runtime.repoPath, runtime.writer);
        return succeed({ status: "success", command: "project.list", projects });
      });
    });
}
