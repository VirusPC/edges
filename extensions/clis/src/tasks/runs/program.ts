import { Command, Option } from "commander";
import { RUNS_AFTER_HELP } from "./help.js";
import type { TasksParseOk } from "../utils/types.js";

export function addRunsCommand(tasks: Command, onCommand: (parsed: TasksParseOk) => void): void {
  tasks
    .command("runs")
    .description("Read-only Run summary for a Task")
    .argument("<target>", "stem or path")
    .addOption(new Option("--output <format>", "table or json").choices(["table", "json"]).default("table"))
    .addHelpText("after", RUNS_AFTER_HELP)
    .action((target: string, opts: { output: "table" | "json" }) => {
      onCommand({ kind: "tasks-runs", target, output: opts.output });
    });
}
