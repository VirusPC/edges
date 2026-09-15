import { Command, Option } from "commander";
import type { CliContext } from "../context.js";
import { TASK_PRIORITIES, type TaskPriority } from "./utils/types.js";
import { runTasksCommand, succeed } from "./utils/result.js";
import { updateTask } from "./utils/write.js";

const UPDATE_AFTER_HELP = `
ARGUMENTS
  <target>  Task stem or path

FLAGS
  --title <title>
  --description <text>
  --body <markdown>
  --assignee <text>
  --priority <priority>    edges-task-priority: urgent | high | medium | low | none
  --json  Write JSON to stdout (always on)

Patches fields in place. Does not move the file; use status to change edges-tasks-status.

EXAMPLES
  edges tasks update 2026-09-11--cli --assignee "Codex"
`;

export function addUpdateCommand(tasks: Command, ctx: CliContext): void {
  tasks
    .command("update")
    .description("Patch Task fields without moving the file")
    .argument("<target>", "stem or path")
    .option("--title <title>")
    .option("--description <text>")
    .option("--body <markdown>")
    .option("--assignee <text>")
    .addOption(new Option("--priority <priority>", "edges-task-priority").choices([...TASK_PRIORITIES]))
    .option("--json", "Write JSON to stdout (always on)")
    .addHelpText("after", UPDATE_AFTER_HELP)
    .action(async (
      target: string,
      opts: { title?: string; description?: string; body?: string; assignee?: string; priority?: TaskPriority },
    ) => {
      await runTasksCommand(ctx, async (runtime) => {
        const updated = await updateTask(
          runtime.repoPath,
          target,
          {
            title: opts.title,
            description: opts.description,
            body: opts.body,
            assignee: opts.assignee,
            priority: opts.priority,
          },
          { fs: runtime.writer, now: runtime.now },
        );
        return succeed({ status: "success", command: "update", ...updated });
      });
    });
}
