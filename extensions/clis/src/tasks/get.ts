import { Command } from "commander";
import type { CliContext } from "../context.js";
import { runTasksCommand, succeed } from "./utils/result.js";
import { getTaskService } from "./utils/service.js";

const GET_AFTER_HELP = `
ARGUMENTS
  <target>  Task stem (e.g. 2026-09-11--cli) or path under knowledge/tasks/

FLAGS
  --json  Write JSON to stdout (always on)

EXAMPLES
  edges tasks get 2026-09-11--cli
`;

export function addGetCommand(tasks: Command, ctx: CliContext): void {
  tasks
    .command("get")
    .description("Get one Task by stem or path")
    .argument("<target>", "stem or path")
    .option("--json", "Write JSON to stdout (always on)")
    .addHelpText("after", GET_AFTER_HELP)
    .action(async (target: string) => {
      await runTasksCommand(ctx, async (io) => {
        const record = await getTaskService(io.repoPath, target, io.fs);
        const { sidecarMarkdown: _sidecarMarkdown, ...task } = record;
        return succeed({ status: "success", command: "get", task });
      });
    });
}
