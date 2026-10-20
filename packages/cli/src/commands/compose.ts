import { Command } from "commander";
import { type CliContext, usageError } from "../context.js";
import { addComposeAddCommand } from "./compose/add.js";
import { addComposeListCommand } from "./compose/list.js";
import { addComposeUpdateCommand } from "./compose/update.js";

const COMPOSE_AFTER_HELP = `
Three commands, named after git submodule. There is no unregister / push / sync:
remove an entry by deleting its line from the AGENTS.md Compose block (and
git submodule deinit / git rm the directory if you want it gone); commit and push
inside the submodule with plain git.
`;

export function addComposeCommand(program: Command, ctx: CliContext): void {
  const compose = program
    .command("compose")
    .description("Composed harness repositories (git submodule add / list / update)")
    .addHelpText("after", COMPOSE_AFTER_HELP);
  compose.action(() => {
    ctx.result = usageError("missing compose command. Use edges compose --help.", "compose");
  });
  addComposeAddCommand(compose, ctx);
  addComposeListCommand(compose, ctx);
  addComposeUpdateCommand(compose, ctx);
}
