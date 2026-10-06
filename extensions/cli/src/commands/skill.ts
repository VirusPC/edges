import { Command } from "commander";
import { type CliContext, usageError } from "../context.js";
import { addSkillCreateCommand } from "./skill/create.js";
import { addSkillDeleteCommand } from "./skill/delete.js";
import { addSkillGetCommand } from "./skill/get.js";
import { addSkillListCommand } from "./skill/list.js";
import { addSkillUpdateCommand } from "./skill/update.js";

export function addSkillCommand(program: Command, ctx: CliContext): void {
  const skill = program
    .command("skill")
    .description("Point skill writes at memory remember. Does not write SKILL.md");
  skill.action(() => {
    ctx.result = usageError("missing skill command. Use edges skill --help.", "root");
  });
  addSkillListCommand(skill, ctx);
  addSkillGetCommand(skill, ctx);
  addSkillCreateCommand(skill, ctx);
  addSkillUpdateCommand(skill, ctx);
  addSkillDeleteCommand(skill, ctx);
}
