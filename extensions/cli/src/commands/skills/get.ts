import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { succeed } from "../result.js";
import { failSkill, relPath, resolveSkill } from "./node.js";

export function addSkillGetCommand(skill: Command, ctx: CliContext): void {
  skill
    .command("get")
    .description("Read one skill by path or name")
    .argument("<target>", "SKILL.md path or skill name")
    .action(async (target: string) => {
      try {
        const { scope, node } = await resolveSkill(ctx, target);
        ctx.result = succeed({
          command: "skills.get",
          name: node.name,
          path: relPath(scope, node.path),
          description: node.description,
          body: node.body,
        });
      } catch (error) {
        failSkill(ctx, error);
      }
    });
}
