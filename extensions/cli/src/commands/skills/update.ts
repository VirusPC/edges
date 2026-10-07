import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { fail } from "../result.js";

export function addSkillUpdateCommand(skill: Command, ctx: CliContext): void {
  skill
    .command("update")
    .description("Point at memory remember. Does not write a SKILL.md")
    .action(() => {
      ctx.result = fail(
        "VALIDATION_ERROR",
        "edges skills update does not write a SKILL.md. Run: edges memory remember",
        "See edges skills --help for usage.\n",
      );
    });
}
