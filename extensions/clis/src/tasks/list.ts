import { Command, Option } from "commander";
import type { CliContext } from "../context.js";
import { parseTaskProject } from "./utils/project.js";
import { parseTaskPriority } from "./utils/priority.js";
import { TASK_PRIORITIES, TASK_STATUSES, type TaskPriority, type TaskProjectId, type TaskStatus } from "./utils/types.js";
import { runTasksCommand, succeed } from "./utils/result.js";
import { GROUPED_LIST_SCHEMA, listGroupedByProject } from "./utils/grouped.js";
import { listTasksService } from "./utils/service.js";

const LIST_AFTER_HELP = `
FLAGS
  --status <edges-tasks-status>  Filter: backlog | todo | in_progress | in_review | done | blocked | cancelled
  --priority <priority>  Repeatable OR filter: urgent | high | medium | low | none
  --project <project>  Repeatable OR filter: default or kebab slug
  --sort priority        urgent → high → medium → low → none (stable). Default stays board order
  --group-by project     After filters, emit grouped snapshot ${GROUPED_LIST_SCHEMA}
  --format json          stdout format (always json)
  --json                          Write JSON to stdout (always on)

Grouped stdout (${GROUPED_LIST_SCHEMA}) is { schema, groups[{id,title,description?}], items[{id|stem, group, title?, status?, …}] }.
Without --group-by the envelope stays { status, command: "list", tasks: [...] }.

EXAMPLES
  edges tasks list
  edges tasks list --status in_progress
  edges tasks list --sort priority
  edges tasks list --priority urgent --priority high
  edges tasks list --status todo --priority high
  edges tasks list --project cli --project default
  edges tasks list --group-by project --format json
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
    .addOption(new Option("--group-by <field>", "group filtered tasks").choices(["project"]))
    .addOption(new Option("--format <format>", "stdout format (always json)").choices(["json"]))
    .option("--json", "Write JSON to stdout (always on)")
    .addHelpText("after", LIST_AFTER_HELP)
    .action(async (opts: {
      status?: TaskStatus;
      priority?: TaskPriority[];
      project?: TaskProjectId[];
      sort?: "priority";
      groupBy?: "project";
      format?: "json";
    }) => {
      await runTasksCommand(ctx, async (runtime) => {
        const listOpts = {
          status: opts.status,
          priorities: opts.priority,
          projects: opts.project,
          sort: opts.sort,
        };
        if (opts.groupBy === "project") {
          const grouped = await listGroupedByProject(runtime.repoPath, listOpts, runtime.fs);
          return succeed({
            status: "success",
            command: "list",
            schema: grouped.schema,
            groups: grouped.groups,
            items: grouped.items,
          });
        }
        const listed = await listTasksService(runtime.repoPath, listOpts, runtime.fs);
        return succeed({ status: "success", command: "list", tasks: listed });
      });
    });
}
