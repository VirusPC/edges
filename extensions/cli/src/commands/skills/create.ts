import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { createManagedSkill } from "../../services/skills/service.js";
import { collectRepeat } from "../metadata.js";
import { failNodeCommand } from "../node-result.js";
import { succeed } from "../result.js";

const HELP = "See edges skills --help for usage.\n";

export function addSkillCreateCommand(skill: Command, ctx: CliContext): void {
  skill
    .command("create")
    .description("Create a managed SKILL.md")
    .argument("<name>", "kebab-case skill name")
    .requiredOption("--description <text>", "Skill description")
    .option("--body <markdown>", "Skill body")
    .option("--metadata <key=value>", "Repeatable frontmatter field", collectRepeat, [])
    .action(async (name: string, opts: { description: string; body?: string; metadata?: string[] }) => {
      try {
        const created = await createManagedSkill(ctx.env, {
          name,
          description: opts.description,
          body: opts.body,
          metadata: opts.metadata,
          super: ctx.super === true,
        });
        ctx.result = succeed({
          command: "skills.create",
          name: created.name,
          path: created.path,
        });
      } catch (error) {
        failNodeCommand(ctx, error, HELP);
      }
    });
}
