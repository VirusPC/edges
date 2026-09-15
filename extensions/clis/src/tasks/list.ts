import { Command, Option } from "commander";
import type { CliContext } from "../context.js";
import { TASK_STATUSES, type TaskStatus } from "./utils/types.js";
import { succeed, tasksRuntime, withTasksResult } from "./utils/result.js";
import { listTasksService } from "./utils/service.js";

const LIST_AFTER_HELP = `
FLAGS
  --status <edges-tasks-status>  Filter: backlog | todo | in_progress | in_review | done | blocked | cancelled
  --json                          Write JSON to stdout (always on)

EXAMPLES
  edges tasks list
  edges tasks list --status in_progress
`;

export function addListCommand(tasks: Command, ctx: CliContext): void {
  tasks
    .command("list")
    .description("List Task files on the board")
    .addOption(new Option("--status <status>", "edges-tasks-status").choices([...TASK_STATUSES]))
    .option("--json", "Write JSON to stdout (always on)")
    .addHelpText("after", LIST_AFTER_HELP)
    .action(async (opts: { status?: TaskStatus }) => {
      ctx.result = await withTasksResult(async () => {
        const io = tasksRuntime(ctx.io);
        const listed = await listTasksService(io.repoPath, { status: opts.status }, io.fs);
        return succeed({ status: "success", command: "list", tasks: listed });
      });
    });
}
