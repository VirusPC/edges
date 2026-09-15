import { Command } from "commander";
import { addCreateCommand } from "./create/index.js";
import { addGetCommand } from "./get/index.js";
import { addListCommand } from "./list/index.js";
import { addRunMessagesCommand } from "./run-messages/index.js";
import { addRunsCommand } from "./runs/index.js";
import { addStatusCommand } from "./status/index.js";
import { addUpdateCommand } from "./update/index.js";
import type { TasksParseOk } from "./utils/types.js";

export function addTasksCommands(tasks: Command, onCommand: (parsed: TasksParseOk) => void): void {
  addListCommand(tasks, onCommand);
  addGetCommand(tasks, onCommand);
  addCreateCommand(tasks, onCommand);
  addUpdateCommand(tasks, onCommand);
  addStatusCommand(tasks, onCommand);
  addRunsCommand(tasks, onCommand);
  addRunMessagesCommand(tasks, onCommand);
}
