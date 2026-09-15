import { Command, Option } from "commander";
import { LIST_AFTER_HELP } from "./help.js";
import { TASK_STATUSES, type TasksParseOk, type TaskStatus } from "../utils/types.js";

export function addListCommand(tasks: Command, onCommand: (parsed: TasksParseOk) => void): void {
  tasks
    .command("list")
    .description("List Task files on the board")
    .addOption(new Option("--status <status>", "edges-tasks-status").choices([...TASK_STATUSES]))
    .option("--json", "Write JSON to stdout (always on)")
    .addHelpText("after", LIST_AFTER_HELP)
    .action((opts: { status?: TaskStatus }) => {
      onCommand({ kind: "tasks-list", status: opts.status });
    });
}
