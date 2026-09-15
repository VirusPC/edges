import { Command, Option } from "commander";
import { CREATE_AFTER_HELP } from "./help.js";
import { TASK_STATUSES, type TasksParseOk, type TaskStatus } from "../utils/types.js";

export function addCreateCommand(tasks: Command, onCommand: (parsed: TasksParseOk) => void): void {
  tasks
    .command("create")
    .description("Create a Task file and empty sidecar (no git)")
    .requiredOption("--title <title>", "Task title")
    .option("--description <text>", "One-line description")
    .option("--body <markdown>", "Body after frontmatter")
    .addOption(new Option("--status <status>", "initial edges-tasks-status").choices([...TASK_STATUSES]))
    .option("--name <name>", "frontmatter name")
    .option("--assignee <text>", "edges-task-assignee")
    .option("--json", "Write JSON to stdout (always on)")
    .addHelpText("after", CREATE_AFTER_HELP)
    .action((opts: {
      title: string;
      description?: string;
      body?: string;
      status?: TaskStatus;
      name?: string;
      assignee?: string;
    }) => {
      onCommand({
        kind: "tasks-create",
        title: opts.title,
        description: opts.description,
        body: opts.body,
        status: opts.status ?? "backlog",
        name: opts.name,
        assignee: opts.assignee,
      });
    });
}
