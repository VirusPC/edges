import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { fail, succeed } from "../result.js";
import { resolveScope } from "../../services/scope.js";
import { listSkills } from "../../services/skills/records.js";

export function addSkillListCommand(skill: Command, ctx: CliContext): void {
  skill.command("list").description("List SKILL.md files under the scope").action(() => {
    try {
      ctx.result = succeed({ command: "skill.list", items: listSkills(resolveScope(ctx.env)) });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      ctx.result = fail("UNKNOWN_ERROR", message, "See edges skill --help for usage.\n");
    }
  });
}
