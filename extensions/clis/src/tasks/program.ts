import { Command, Option } from "commander";
import { TASK_STATUSES, type TasksParseOk, type TaskStatus } from "./types.js";
import { isTaskStatus } from "./paths.js";

export function addTasksCommands(tasks: Command, onCommand: (parsed: TasksParseOk) => void): void {
  tasks
    .command("list")
    .description("List Task files on the board")
    .addOption(new Option("--status <status>", "edges-tasks-status").choices([...TASK_STATUSES]))
    .option("--json", "Write JSON to stdout (always on)")
    .action((opts: { status?: TaskStatus }) => {
      onCommand({ kind: "tasks-list", status: opts.status });
    });

  tasks
    .command("get")
    .description("Get one Task by stem or path")
    .argument("<target>", "stem or path")
    .option("--json", "Write JSON to stdout (always on)")
    .action((target: string) => {
      onCommand({ kind: "tasks-get", target });
    });

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

  tasks
    .command("update")
    .description("Patch Task fields without moving the file")
    .argument("<target>", "stem or path")
    .option("--title <title>")
    .option("--description <text>")
    .option("--body <markdown>")
    .option("--assignee <text>")
    .option("--json", "Write JSON to stdout (always on)")
    .action((
      target: string,
      opts: { title?: string; description?: string; body?: string; assignee?: string },
    ) => {
      onCommand({
        kind: "tasks-update",
        target,
        title: opts.title,
        description: opts.description,
        body: opts.body,
        assignee: opts.assignee,
      });
    });

  tasks
    .command("status")
    .description("Move a Task (and sidecar) to another edges-tasks-status")
    .argument("<target>", "stem or path")
    .argument("<status>", "next edges-tasks-status")
    .option("--json", "Write JSON to stdout (always on)")
    .action((target: string, status: string) => {
      if (!isTaskStatus(status)) {
        throw new Error(`invalid edges-tasks-status: ${status}`);
      }
      onCommand({ kind: "tasks-status", target, next: status });
    });

  tasks
    .command("runs")
    .description("Read-only Run summary for a Task")
    .argument("<target>", "stem or path")
    .addOption(new Option("--output <format>", "table or json").choices(["table", "json"]).default("table"))
    .action((target: string, opts: { output: "table" | "json" }) => {
      onCommand({ kind: "tasks-runs", target, output: opts.output });
    });

  tasks
    .command("run-messages")
    .description("Read-only messages for one run-id")
    .argument("<run-id>", "stable run-id or numeric n with --task")
    .option("--task <stem>", "scope a short run-id")
    .addOption(new Option("--output <format>", "table or json").choices(["table", "json"]).default("table"))
    .action((runId: string, opts: { task?: string; output: "table" | "json" }) => {
      onCommand({ kind: "tasks-run-messages", runId, task: opts.task, output: opts.output });
    });
}
