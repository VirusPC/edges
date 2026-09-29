import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { getProject } from "../utils/project-meta.js";
import { runTasksCommand, succeed } from "../utils/result.js";

export function addProjectGetCommand(project: Command, ctx: CliContext): void {
  project
    .command("get")
    .description("Get Task Project metadata")
    .argument("<project>", "default or kebab slug")
    .option("--json", "Write JSON to stdout (always on)")
    .action(async (projectId: string) => {
      await runTasksCommand(ctx, async (runtime) => {
        const record = await getProject(runtime.repoPath, projectId, runtime.writer);
        return succeed({ status: "success", command: "project.get", ...record });
      });
    });
}
