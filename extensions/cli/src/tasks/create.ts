import { Command, Option } from "commander";
import type { CliContext } from "../context.js";
import { TASK_PRIORITIES, TASK_STATUSES, type TaskPriority, type TaskStatus } from "./utils/types.js";
import { runTasksCommand, succeed } from "./utils/result.js";
import { createTask } from "./utils/write.js";

const CREATE_AFTER_HELP = `
FLAGS
  --title <title>          Required. Task title
  --description <text>    One-line description
  --body <markdown>        Body after frontmatter
  --status <status>       Initial edges-tasks-status (default: backlog)
  --name <name>            frontmatter name
  --assignee <text>        edges-task-assignee
  --priority <priority>    edges-task-priority: urgent | high | medium | low | none
  --project <project>      edges-task-project (default, or lowercase kebab slug)
  --json                   Write JSON to stdout (always on)

Writes the Task file plus an empty sidecar .{stem}.log.md. No git.

EXAMPLES
  edges tasks create --title "Ship CLI layout"
`;

export function addCreateCommand(tasks: Command, ctx: CliContext): void {
  tasks
    .command("create")
    .description("Create a Task file and empty sidecar (no git)")
    .requiredOption("--title <title>", "Task title")
    .option("--description <text>", "One-line description")
    .option("--body <markdown>", "Body after frontmatter")
    .addOption(new Option("--status <status>", "initial edges-tasks-status").choices([...TASK_STATUSES]))
    .option("--name <name>", "frontmatter name")
    .option("--assignee <text>", "edges-task-assignee")
    .addOption(new Option("--priority <priority>", "edges-task-priority").choices([...TASK_PRIORITIES]))
    .option("--project <project>", "edges-task-project (default, or lowercase kebab slug)")
    .option("--json", "Write JSON to stdout (always on)")
    .addHelpText("after", CREATE_AFTER_HELP)
    .action(async (opts: {
      title: string;
      description?: string;
      body?: string;
      status?: TaskStatus;
      name?: string;
      assignee?: string;
      priority?: TaskPriority;
      project?: string;
    }) => {
      await runTasksCommand(ctx, async (runtime) => {
        const created = await createTask(
          runtime.repoPath,
          {
            title: opts.title,
            description: opts.description,
            body: opts.body,
            status: opts.status ?? "backlog",
            name: opts.name,
            assignee: opts.assignee,
            priority: opts.priority,
            project: opts.project,
          },
          { fs: runtime.writer, now: runtime.now },
        );
        return succeed({ status: "success", command: "create", ...created });
      });
    });
}
