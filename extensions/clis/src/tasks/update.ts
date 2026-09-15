import { Command } from "commander";
import type { CliContext } from "../context.js";
import { succeed, tasksRuntime, withTasksResult } from "./utils/result.js";
import { updateTask } from "./utils/write.js";

const UPDATE_AFTER_HELP = `
ARGUMENTS
  <target>  Task stem or path

FLAGS
  --title <title>
  --description <text>
  --body <markdown>
  --assignee <text>
  --json  Write JSON to stdout (always on)

Patches fields in place. Does not move the file; use status to change edges-tasks-status.

EXAMPLES
  edges tasks update 2026-09-11--cli --assignee "Codex"
`;

export function addUpdateCommand(tasks: Command, ctx: CliContext): void {
  tasks
    .command("update")
    .description("Patch Task fields without moving the file")
    .argument("<target>", "stem or path")
    .option("--title <title>")
    .option("--description <text>")
    .option("--body <markdown>")
    .option("--assignee <text>")
    .option("--json", "Write JSON to stdout (always on)")
    .addHelpText("after", UPDATE_AFTER_HELP)
    .action(async (
      target: string,
      opts: { title?: string; description?: string; body?: string; assignee?: string },
    ) => {
      ctx.result = await withTasksResult(async () => {
        const io = tasksRuntime(ctx.io);
        const updated = await updateTask(
          io.repoPath,
          target,
          {
            title: opts.title,
            description: opts.description,
            body: opts.body,
            assignee: opts.assignee,
          },
          { fs: io.writer, now: io.now },
        );
        return succeed({ status: "success", command: "update", ...updated });
      });
    });
}
