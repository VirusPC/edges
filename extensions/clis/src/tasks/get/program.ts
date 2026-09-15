import { Command } from "commander";
import { GET_AFTER_HELP } from "./help.js";
import type { TasksParseOk } from "../utils/types.js";

export function addGetCommand(tasks: Command, onCommand: (parsed: TasksParseOk) => void): void {
  tasks
    .command("get")
    .description("Get one Task by stem or path")
    .argument("<target>", "stem or path")
    .option("--json", "Write JSON to stdout (always on)")
    .addHelpText("after", GET_AFTER_HELP)
    .action((target: string) => {
      onCommand({ kind: "tasks-get", target });
    });
}
