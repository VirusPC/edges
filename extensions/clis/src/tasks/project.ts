import { Command } from "commander";
import { type CliContext, usageError } from "../context.js";
import { addProjectCreateCommand } from "./project/create.js";
import { addProjectGetCommand } from "./project/get.js";
import { addProjectListCommand } from "./project/list.js";
import { addProjectUpdateCommand } from "./project/update.js";

const PROJECT_AFTER_HELP = `
COMMANDS
  list
  get <project>
  create <project> --title <title> --description <text>
  update <project> [--title] [--description]

<project> is default or a lowercase kebab slug (not _default).
create writes knowledge/tasks/<dir>/AGENTS.md and refreshes the root Task Projects section.
update changes title/description only. Task files move with: edges tasks update --project
There is no edges tasks classify verb.

EXAMPLES
  edges tasks project list
  edges tasks project create cli --title "CLI" --description "edges CLI work"
`;

export function addProjectCommand(tasks: Command, ctx: CliContext): void {
  const project = tasks
    .command("project")
    .description("Task Project metadata (index/description layer)")
    .allowExcessArguments(false)
    .showHelpAfterError(false)
    .helpOption("-h, --help", "Show this help");
  addProjectListCommand(project, ctx);
  addProjectGetCommand(project, ctx);
  addProjectCreateCommand(project, ctx);
  addProjectUpdateCommand(project, ctx);
  project.action(() => {
    ctx.result = usageError("missing project subcommand. Use edges tasks project --help.", "tasks");
  });
  project.addHelpText("after", PROJECT_AFTER_HELP);
}
