import { Command } from "commander";
import { type CliContext, usageError } from "../context.js";
import { addCreateCommand } from "./tasks/create.js";
import { addDeleteCommand } from "./tasks/delete.js";
import { addGetCommand } from "./tasks/get.js";
import { addTaskInitCommand } from "./tasks/init.js";
import { addListCommand } from "./tasks/list.js";
import { addRunMessagesCommand } from "./tasks/run-messages.js";
import { addRunsCommand } from "./tasks/runs.js";
import { addStatusCommand } from "./tasks/status.js";
import { addReviewPageCommand } from "./tasks/review-page.js";
import { addUpdateCommand } from "./tasks/update.js";

const TASKS_AFTER_HELP = `
TARGET
  edges --scope <directory> tasks ...
  edges --scope <directory> --project <path> tasks ...
  --project selects an existing Project under scope/.edges/projects, or scope/projects with --super.
  Tasks live directly at the selected material root: tasks/<status>/<stem>/INDEX.md.
  --super and --all are root switches. --all is read-only.
COMMANDS
  list [--status <status>] [--priority <priority>]... [--sort priority] [--group-by <field>]
  get <stem|path>
  create --title <title> [--description] [--body] [--status] [--name] [--assignee] [--priority]
  update <stem|path> [--title] [--description] [--body] [--assignee] [--priority]
    [--to-project <path> | --to-default] moves the directory with resources and run logs.
  status <stem|path> <status>
  delete <stem|path> prints the status cancelled command; it does not delete files.
  init [--target-dir] [--root-dir] [--description]
  runs <stem|path> [--output table|json]
  run-messages <run-id> [--task <stem>] [--output table|json]
  review-page --from <path|-> [--out <path>]

Manage Projects with edges projects. There is no separate Task Project model.
Issue commands emit JSON; run commands default to tables. Run logs are read-only.
`;

export function addTasksCommand(program: Command, ctx: CliContext): void {
  const tasks = program
    .command("tasks")
    .description("Task board commands")
    .allowExcessArguments(false)
    .showHelpAfterError(false)
    .helpOption("-h, --help", "Show this help");

  addListCommand(tasks, ctx);
  addGetCommand(tasks, ctx);
  addCreateCommand(tasks, ctx);
  addDeleteCommand(tasks, ctx);
  addUpdateCommand(tasks, ctx);
  addReviewPageCommand(tasks, ctx);
  addStatusCommand(tasks, ctx);
  addRunsCommand(tasks, ctx);
  addRunMessagesCommand(tasks, ctx);
  addTaskInitCommand(tasks, ctx);
  tasks.action(() => {
    ctx.result = usageError("missing tasks subcommand. Use edges tasks --help.", "tasks");
  });
  tasks.addHelpText("after", TASKS_AFTER_HELP);
}
