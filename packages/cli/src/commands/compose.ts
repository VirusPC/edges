import { Command } from "commander";
import { type CliContext, usageError } from "../context.js";
import { addComposeAddCommand } from "./compose/add.js";
import { addComposeDoctorCommand } from "./compose/doctor.js";
import { addComposeListCommand } from "./compose/list.js";
import { addComposeUpdateCommand } from "./compose/update.js";

const COMPOSE_AFTER_HELP = `
Daily commands, named after git submodule: add, list, update. There is no
unregister / push / sync: remove an entry by deleting its line from
.harness/compose/README.md (and git submodule deinit / git rm the directory if
you want it gone); commit and push inside the submodule with plain git.
compose doctor is migration-only: it moves a Compose block off AGENTS.md.
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
  addComposeDoctorCommand(compose, ctx);
}
