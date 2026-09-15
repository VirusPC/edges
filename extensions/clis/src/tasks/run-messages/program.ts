import { Command, Option } from "commander";
import { RUN_MESSAGES_AFTER_HELP } from "./help.js";
import type { TasksParseOk } from "../utils/types.js";

export function addRunMessagesCommand(tasks: Command, onCommand: (parsed: TasksParseOk) => void): void {
  tasks
    .command("run-messages")
    .description("Read-only messages for one run-id")
    .argument("<run-id>", "stable run-id or numeric n with --task")
    .option("--task <stem>", "scope a short run-id")
    .addOption(new Option("--output <format>", "table or json").choices(["table", "json"]).default("table"))
    .addHelpText("after", RUN_MESSAGES_AFTER_HELP)
    .action((runId: string, opts: { task?: string; output: "table" | "json" }) => {
      onCommand({ kind: "tasks-run-messages", runId, task: opts.task, output: opts.output });
    });
}
