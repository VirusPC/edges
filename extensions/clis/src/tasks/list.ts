import { Command, Option } from "commander";
import type { CliContext } from "../context.js";
import { parseTaskProject } from "./utils/project.js";
import { parseTaskPriority } from "./utils/priority.js";
import { TASK_PRIORITIES, TASK_STATUSES, type TaskPriority, type TaskProjectId, type TaskStatus } from "./utils/types.js";
import { runTasksCommand, succeed } from "./utils/result.js";
import { listTasksService } from "./utils/service.js";

const LIST_AFTER_HELP = `
FLAGS
  --status <edges-tasks-status>  Filter: backlog | todo | in_progress | in_review | done | blocked | cancelled
  --priority <priority>  Repeatable OR filter: urgent | high | medium | low | none
  --project <project>  Repeatable OR filter: default or kebab slug
  --sort priority        urgent → high → medium → low → none (stable). Default stays board order
  --json                          Write JSON to stdout (always on)

EXAMPLES
  edges tasks list
  edges tasks list --status in_progress
  edges tasks list --sort priority
  edges tasks list --priority urgent --priority high
  edges tasks list --status todo --priority high
  edges tasks list --project cli --project default
`;

export function addListCommand(tasks: Command, ctx: CliContext): void {
  tasks
    .command("list")
    .description("List Task files on the board")
    .addOption(new Option("--status <status>", "edges-tasks-status").choices([...TASK_STATUSES]))
    .addOption(
      new Option("--priority <priority>", "edges-task-priority (repeatable, OR)")
        .choices([...TASK_PRIORITIES])
        .argParser((value: string, previous: TaskPriority[]) => [
          ...(previous ?? []),
          parseTaskPriority(value),
        ]),
    )
    .addOption(
      new Option("--project <project>", "edges-task-project (repeatable, OR)")
        .argParser((value: string, previous: TaskProjectId[]) => [
          ...(previous ?? []),
          parseTaskProject(value),
        ]),
    )
    .addOption(new Option("--sort <field>", "sort list").choices(["priority"]))
    .option("--json", "Write JSON to stdout (always on)")
    .addHelpText("after", LIST_AFTER_HELP)
    .action(async (opts: {
      status?: TaskStatus;
      priority?: TaskPriority[];
      project?: TaskProjectId[];
      sort?: "priority";
    }) => {
      await runTasksCommand(ctx, async (runtime) => {
        const listed = await listTasksService(
          runtime.repoPath,
          { status: opts.status, priorities: opts.priority, projects: opts.project, sort: opts.sort },
          runtime.fs,
        );
        return succeed({ status: "success", command: "list", tasks: listed });
      });
    });
}
