import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { fail, succeed } from "../result.js";
import { resolveScope } from "../../services/scope.js";
import { getSkill } from "../../services/skills/records.js";

export function addSkillGetCommand(skill: Command, ctx: CliContext): void {
  skill
    .command("get")
    .description("Read one skill by path or name")
    .argument("<target>", "SKILL.md path or skill name")
    .action((target: string) => {
      try {
        ctx.result = succeed({ command: "skills.get", ...getSkill(resolveScope(ctx.env), target) });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        ctx.result = fail(
          message.includes("not found") || message.includes("ambiguous") ? "VALIDATION_ERROR" : "UNKNOWN_ERROR",
          message,
          "See edges skills --help for usage.\n",
        );
      }
    });
}
