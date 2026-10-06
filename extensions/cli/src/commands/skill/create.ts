import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { fail } from "../result.js";

export function addSkillCreateCommand(skill: Command, ctx: CliContext): void {
  skill
    .command("create")
    .description("Point at memory remember. Does not write a SKILL.md")
    .action(() => {
      ctx.result = fail(
        "VALIDATION_ERROR",
        "edges skill create does not write a SKILL.md. Run: edges memory remember",
        "See edges skill --help for usage.\n",
      );
    });
}
