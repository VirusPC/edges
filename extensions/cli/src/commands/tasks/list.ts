import { Command, Option } from "commander";
import type { CliContext } from "../../context.js";
import { parseTaskProject } from "../../domain/models/tasks/project.js";
import { parseTaskPriority } from "../../domain/models/tasks/priority.js";
import { TASK_PRIORITIES, TASK_STATUSES, type TaskPriority, type TaskProjectId, type TaskStatus } from "../../domain/models/tasks/types.js";
import { runTasksCommand, succeed } from "./run.js";
import { listTasksService } from "../../services/tasks/service.js";
import { listRepositoryTasksWithDocs, listTasksWithDocs } from "../../services/tasks/board.js";
import { gitRoot } from "../../services/scope.js";
import { TasksError } from "../../domain/models/tasks/types.js";
import { groupRecords, matchesFilters, parseFieldFilter, type FieldFilter } from "../../services/list-query.js";

const LIST_AFTER_HELP = `
FLAGS
  --all-scopes           All registered repository scopes and maintenance levels; both purposes unless explicitly filtered
  --status <edges-tasks-status>  Filter: backlog | todo | in_progress | in_review | done | blocked | cancelled
  --priority <priority>  Repeatable OR filter: urgent | high | medium | low | none
  --project <project>  Repeatable OR filter: default or kebab slug
  --sort priority        urgent → high → medium → low → none (stable). Default stays board order
  --group-by <field>    After filters, emit { groupBy, groups: [{ key, items }] }
  --filter <field=value>  Repeatable. Same field is OR, different fields are AND

Grouped stdout is { status, command, groupBy, groups }. Items may include optional doc. Without --group-by the envelope stays { status, command: "list", tasks: [...] } and tasks do not include doc.

EXAMPLES
  edges tasks list
  edges tasks list --all-scopes
  edges tasks --purpose maintenance list --all-scopes
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
    .option("--all-scopes", "List all registered repository tasks, including every maintenance level")
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
    .addOption(new Option("--group-by <field>", "group filtered tasks by one field"))
    .addOption(new Option("--format <format>", "stdout format (always json)").choices(["json"]))
    .option("--filter <field=value>", "Repeatable field filter", (value: string, previous: string[] = []) => [
      ...previous,
      value,
    ])
    .option("--json", "Write JSON to stdout (always on)")
    .addHelpText("after", LIST_AFTER_HELP)
    .action(async (opts: {
      allScopes?: boolean;
      status?: TaskStatus;
      priority?: TaskPriority[];
      project?: TaskProjectId[];
      sort?: "priority";
      groupBy?: string;
      format?: "json";
      filter?: string[];
    }) => {
      await runTasksCommand(ctx, async (runtime) => {
        let filters: FieldFilter[];
        try {
          filters = (opts.filter ?? []).map(parseFieldFilter);
        } catch (error) {
          throw new TasksError(
            "VALIDATION_ERROR",
            error instanceof Error ? error.message : String(error),
          );
        }
        const listOpts = {
          status: opts.status,
          priorities: opts.priority,
          projects: opts.project,
          sort: opts.sort,
        };
        const repositoryRoot = opts.allScopes
          ? gitRoot(runtime.location.scopeDir) ?? runtime.location.scopeDir
          : undefined;
        const purpose = tasks.getOptionValueSource("purpose") === "cli" ? ctx.purpose : undefined;
        const listed = repositoryRoot
          ? await listRepositoryTasksWithDocs(repositoryRoot, listOpts, purpose)
          : opts.groupBy
            ? await listTasksWithDocs(runtime.location, listOpts, runtime.fs)
            : await listTasksService(runtime.location, listOpts, runtime.fs);
        const filtered = listed.filter((item) =>
          matchesFilters(item as unknown as Record<string, unknown>, filters),
        );
        if (opts.groupBy) {
          return succeed({
            status: "success",
            command: "list",
            groupBy: opts.groupBy,
            groups: groupRecords(filtered as unknown as Record<string, unknown>[], opts.groupBy),
          });
        }
        const tasksOnly = filtered.map((item) => {
          const { doc: _doc, ...rest } = item as { doc?: unknown };
          return rest;
        });
        return succeed({ status: "success", command: "list", tasks: tasksOnly });
      });
    });
}
