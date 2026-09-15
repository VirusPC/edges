import { Command } from "commander";
import { type CliContext, usageError } from "./context.js";
import { addCreateCommand } from "./tasks/create.js";
import { addGetCommand } from "./tasks/get.js";
import { addListCommand } from "./tasks/list.js";
import { addRunMessagesCommand } from "./tasks/run-messages.js";
import { addRunsCommand } from "./tasks/runs.js";
import { addStatusCommand } from "./tasks/status.js";
import { addUpdateCommand } from "./tasks/update.js";

const TASKS_AFTER_HELP = `
COMMANDS
  list [--status <edges-tasks-status>]
  get <stem|path>
  create --title <title> [--description] [--body] [--status] [--name] [--assignee]
  update <stem|path> [--title] [--description] [--body] [--assignee]
  status <stem|path> <edges-tasks-status>
  runs <stem|path> [--output table|json]
  run-messages <run-id> [--task <stem>] [--output table|json]

Issue layer stdout is JSON. runs / run-messages default to a table; pass --output json.

Cancel a Task with: edges tasks status <stem> cancelled
There is no delete command.

Run layer is read-only (no append). Skill and MCP will use this same contract later.
Capability Surface is CLI + Skill + MCP.

EXAMPLES
  edges tasks list --status in_progress
  edges tasks get 2026-09-11--cli
  edges tasks runs 2026-09-11--cli --output json
  edges tasks run-messages 2026-09-11--cli--1
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
  addUpdateCommand(tasks, ctx);
  addStatusCommand(tasks, ctx);
  addRunsCommand(tasks, ctx);
  addRunMessagesCommand(tasks, ctx);
  tasks.action(() => {
    ctx.result = usageError("missing tasks subcommand. Use edges tasks --help.", "tasks");
  });
  tasks.addHelpText("after", TASKS_AFTER_HELP);
}
