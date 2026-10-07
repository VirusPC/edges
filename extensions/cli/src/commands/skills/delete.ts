import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { succeed } from "../result.js";
import { failSkill, relPath, resolveSkill } from "./node.js";

export function addSkillDeleteCommand(skill: Command, ctx: CliContext): void {
  skill
    .command("delete")
    .description("Delete one skill")
    .argument("<target>", "SKILL.md path or skill name")
    .action(async (target: string) => {
      try {
        const { scope, service, node } = await resolveSkill(ctx, target);
        const file = node.path;
        await service.destroy(node);
        ctx.result = succeed({ command: "skills.delete", path: relPath(scope, file) });
      } catch (error) {
        failSkill(ctx, error);
      }
    });
}
