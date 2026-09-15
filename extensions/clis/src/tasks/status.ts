import { Command } from "commander";
import type { CliContext } from "../context.js";
import { isTaskStatus } from "./utils/paths.js";
import { fail, runTasksCommand, succeed } from "./utils/result.js";
import { moveTaskStatus } from "./utils/move.js";

const STATUS_AFTER_HELP = `
ARGUMENTS
  <target>  Task stem or path
  <status>  Next edges-tasks-status: backlog | todo | in_progress | in_review | done | blocked | cancelled

FLAGS
  --json  Write JSON to stdout (always on)

Moves the Task file and its sidecar. Cancel with: cancelled. There is no delete command.

EXAMPLES
  edges tasks status 2026-09-11--cli in_progress
  edges tasks status 2026-09-11--cli cancelled
`;

export function addStatusCommand(tasks: Command, ctx: CliContext): void {
  tasks
    .command("status")
    .description("Move a Task (and sidecar) to another edges-tasks-status")
    .argument("<target>", "stem or path")
    .argument("<status>", "next edges-tasks-status")
    .option("--json", "Write JSON to stdout (always on)")
    .addHelpText("after", STATUS_AFTER_HELP)
    .action(async (target: string, status: string) => {
      await runTasksCommand(ctx, async (io) => {
        if (!isTaskStatus(status)) {
          return fail("VALIDATION_ERROR", `invalid edges-tasks-status: ${status}`);
        }
        const moved = await moveTaskStatus(io.repoPath, target, status, {
          fs: io.writer,
          now: io.now,
        });
        return succeed({ status: "success", command: "status", ...moved });
      });
    });
}
