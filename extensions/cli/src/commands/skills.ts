import { Command } from "commander";
import { type CliContext, usageError } from "../context.js";
import { addSkillCreateCommand } from "./skills/create.js";
import { addSkillDeleteCommand } from "./skills/delete.js";
import { addSkillGetCommand } from "./skills/get.js";
import { addSkillInitCommand } from "./skills/init.js";
import { addSkillListCommand } from "./skills/list.js";
import { addSkillUpdateCommand } from "./skills/update.js";

export function addSkillsCommand(program: Command, ctx: CliContext): void {
  const skills = program
    .command("skills")
    .description("Skill commands. create and update write skills/managed/<name>/SKILL.md");
  skills.action(() => {
    ctx.result = usageError("missing skills command. Use edges skills --help.", "skills");
  });
  addSkillListCommand(skills, ctx);
  addSkillGetCommand(skills, ctx);
  addSkillCreateCommand(skills, ctx);
  addSkillUpdateCommand(skills, ctx);
  addSkillDeleteCommand(skills, ctx);
  addSkillInitCommand(skills, ctx);
}
