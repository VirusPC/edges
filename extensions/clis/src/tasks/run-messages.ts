import { Command, Option } from "commander";
import type { CliContext } from "../context.js";
import { formatRunMessagesTable } from "./utils/format.js";
import { succeed, tasksRuntime, withTasksResult } from "./utils/result.js";
import { findRun } from "./utils/service.js";

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
      ctx.result = await withTasksResult(async () => {
        const io = tasksRuntime(ctx.io);
        const found = await findRun(io.repoPath, runId, opts.task, io.fs);
        const payload = {
          status: "success" as const,
          command: "run-messages" as const,
          run: found.run,
          messages: found.messages,
        };
        if (opts.output === "json") {
          return succeed(payload);
        }
        return succeed(payload, formatRunMessagesTable(found.run, found.messages));
      });
    });
}
