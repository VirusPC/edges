import { Command, Option } from "commander";
import type { CliContext } from "../../context.js";
import { TASK_PRIORITIES, type TaskPriority } from "../../domain/models/tasks/types.js";
import { runTasksCommand, succeed } from "./run.js";
import { updateTask } from "../../services/tasks/service.js";

const UPDATE_AFTER_HELP = `
ARGUMENTS
  <target>  Task stem or path

FLAGS
  --title <title>
  --description <text>
  --body <markdown>
  --assignee <text>
  --name <name>            frontmatter name
  --priority <priority>    edges-task-priority: urgent | high | medium | low | none
  --to-project <path>     move to a Project relative to scope/.edges/projects
  --to-default            move to the scope tasks board
  --json  Write JSON to stdout (always on)

Patches fields in place. Destination flags move the Task directory, resources and run log without changing status.

EXAMPLES
  edges tasks update 2026-09-11--cli --assignee "Codex"
  edges tasks update 2026-09-11--cli --to-project 2026-09-11--cli
`;

export function addUpdateCommand(tasks: Command, ctx: CliContext): void {
  tasks
    .command("update")
    .description("Patch Task fields or move its directory to another Project")
    .argument("<target>", "stem or path")
    .option("--title <title>")
    .option("--description <text>")
    .option("--body <markdown>")
    .option("--assignee <text>")
    .option("--name <name>", "frontmatter name")
    .addOption(new Option("--priority <priority>", "edges-task-priority").choices([...TASK_PRIORITIES]))
    .addOption(new Option("--to-project <path>", "Destination Project relative to scope/.edges/projects").conflicts("toDefault"))
    .addOption(new Option("--to-default", "Return to the scope tasks board").conflicts("toProject"))
    .option("--json", "Write JSON to stdout (always on)")
    .addHelpText("after", UPDATE_AFTER_HELP)
    .action(async (
      target: string,
      opts: {
        title?: string;
        description?: string;
        body?: string;
        assignee?: string;
        name?: string;
        priority?: TaskPriority;
        toProject?: string;
        toDefault?: boolean;
      },
    ) => {
      await runTasksCommand(ctx, async (runtime) => {
        const updated = await updateTask(
          runtime.location,
          target,
          {
            title: opts.title,
            description: opts.description,
            body: opts.body,
            assignee: opts.assignee,
            name: opts.name,
            priority: opts.priority,
            toProject: opts.toProject,
            toDefault: opts.toDefault,
          },
          { fs: runtime.writer, now: runtime.now },
        );
        return succeed({ status: "success", command: "update", ...updated });
      });
    });
}
