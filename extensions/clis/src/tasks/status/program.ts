import { Command } from "commander";
import { STATUS_AFTER_HELP } from "./help.js";
import { isTaskStatus } from "../utils/paths.js";
import type { TasksParseOk } from "../utils/types.js";

export function addStatusCommand(tasks: Command, onCommand: (parsed: TasksParseOk) => void): void {
  tasks
    .command("status")
    .description("Move a Task (and sidecar) to another edges-tasks-status")
    .argument("<target>", "stem or path")
    .argument("<status>", "next edges-tasks-status")
    .option("--json", "Write JSON to stdout (always on)")
    .addHelpText("after", STATUS_AFTER_HELP)
    .action((target: string, status: string) => {
      if (!isTaskStatus(status)) {
        throw new Error(`invalid edges-tasks-status: ${status}`);
      }
      onCommand({ kind: "tasks-status", target, next: status });
    });
}
