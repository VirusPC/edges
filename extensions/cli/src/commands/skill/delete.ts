import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { fail, succeed } from "../result.js";
import { resolveScope } from "../../services/scope.js";
import { deleteSkill } from "../../services/skills/records.js";

export function addSkillDeleteCommand(skill: Command, ctx: CliContext): void {
  skill
    .command("delete")
    .description("Delete one skill directory")
    .argument("<target>", "SKILL.md path or skill name")
    .action((target: string) => {
      try {
        ctx.result = succeed({ command: "skill.delete", ...deleteSkill(resolveScope(ctx.env), target) });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        ctx.result = fail(
          message.includes("not found") || message.includes("ambiguous") ? "VALIDATION_ERROR" : "UNKNOWN_ERROR",
          message,
          "See edges skill --help for usage.\n",
        );
      }
    });
}
