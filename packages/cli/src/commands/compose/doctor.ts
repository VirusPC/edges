import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { doctorCompose } from "../../services/compose/service.js";
import { failNodeCommand } from "../node-result.js";
import { succeed } from "../result.js";

const HELP = "See edges compose doctor --help for usage.\n";

export function addComposeDoctorCommand(compose: Command, ctx: CliContext): void {
  compose
    .command("doctor")
    .description("One-shot migration of the AGENTS.md Compose block into .harness/compose/README.md (dry-run unless --apply)")
    .option("--apply", "Write the migration. Without this flag, only report what would change")
    .allowExcessArguments(false)
    .addHelpText("after", `
Daily edits stay on compose add, list, and update. doctor only moves an existing
AGENTS.md Compose block into .harness/compose/README.md, rewrites those hrefs,
links the entry from .harness/README.md, and strips --with-composed from docs.
`)
    .action(async (opts: { apply?: boolean }) => {
      try {
        const apply = opts.apply === true;
        const { changes, warnings } = await doctorCompose(ctx.env, apply);
        ctx.result = succeed({
          command: "compose.doctor",
          apply,
          changes,
        }, warnings.join(""));
      } catch (error) {
        failNodeCommand(ctx, error, HELP);
      }
    });
}
