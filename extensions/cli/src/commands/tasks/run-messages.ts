import { Command, Option } from "commander";
import type { CliContext } from "../../context.js";
import { findRun, formatRunMessagesTable } from "../../services/tasks/service.js";
import { runTasksCommand, succeed } from "./run.js";

const RUN_MESSAGES_AFTER_HELP = `
ARGUMENTS
  <run-id>  Stable run-id, or a short numeric n together with --task

FLAGS
  --task <stem>      Scope a short run-id to this Task
  --output <format>  table (default) or json

Read-only messages for one run. No append.

EXAMPLES
  edges tasks run-messages 2026-09-11--cli--1
  edges tasks run-messages 1 --task 2026-09-11--cli --output json
`;

export function addRunMessagesCommand(tasks: Command, ctx: CliContext): void {
  tasks
    .command("run-messages")
    .description("Read-only messages for one run-id")
    .argument("<run-id>", "stable run-id or numeric n with --task")
    .option("--task <stem>", "scope a short run-id")
    .addOption(new Option("--output <format>", "table or json").choices(["table", "json"]).default("table"))
    .addHelpText("after", RUN_MESSAGES_AFTER_HELP)
    .action(async (runId: string, opts: { task?: string; output: "table" | "json" }) => {
      await runTasksCommand(ctx, async (runtime) => {
        const found = await findRun(runtime.location, runId, opts.task, runtime.fs);
        const payload = {
          status: "success" as const,
          command: "run-messages" as const,
          run: found.run,
          messages: found.messages,
        };
        const result = succeed(payload);
        if (opts.output === "json") {
          return result;
        }
        return { ...result, stdout: formatRunMessagesTable(found.run, found.messages) };
      });
    });
}
