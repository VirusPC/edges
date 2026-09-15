import { Command } from "commander";
import { UPDATE_AFTER_HELP } from "./help.js";
import type { TasksParseOk } from "../utils/types.js";

export function addUpdateCommand(tasks: Command, onCommand: (parsed: TasksParseOk) => void): void {
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
    .action((
      target: string,
      opts: { title?: string; description?: string; body?: string; assignee?: string },
    ) => {
      onCommand({
        kind: "tasks-update",
        target,
        title: opts.title,
        description: opts.description,
        body: opts.body,
        assignee: opts.assignee,
      });
    });
}
