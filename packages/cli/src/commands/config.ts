import { Command } from "commander";
import { type CliContext, usageError } from "../context.js";
import { addConfigInitCommand } from "./config/init.js";
import { addConfigPathCommand } from "./config/path.js";
import { addConfigShowCommand } from "./config/show.js";

const CONFIG_AFTER_HELP = `
COMMANDS
  init     Create ~/.config/edges/edges.env. If artifacts-preview.env exists
           and edges.env does not, copy it once. Does not keep reading the old file.
  path     Print the edges.env path. The file does not need to exist.
  show     Print assignments. SECRET, TOKEN, PASSWORD, and *_KEY values are ***.

edges artifacts server and edges evaluation server read this file only.
If it is missing they error and tell you to run: edges config init
`;

export function addConfigCommand(program: Command, ctx: CliContext): void {
  const config = program
    .command("config")
    .description("Unified ~/.config/edges/edges.env")
    .allowExcessArguments(false)
    .showHelpAfterError(false)
    .helpOption("-h, --help", "Show this help")
    .addHelpText("after", CONFIG_AFTER_HELP);
  config.action(() => {
    ctx.result = usageError("missing config command. Use edges config --help.", "config");
  });
  addConfigInitCommand(config, ctx);
  addConfigPathCommand(config, ctx);
  addConfigShowCommand(config, ctx);
}
