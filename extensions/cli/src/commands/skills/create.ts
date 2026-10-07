import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { SkillNode } from "../../domain/models/skills/skill-node.js";
import { collectRepeat, parseMetadata } from "../metadata.js";
import { succeed } from "../result.js";
import { failSkill, managedSkillFile, relPath, skillService } from "./node.js";

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
        if (!opts.description.trim()) throw new Error("description must be nonempty");
        const metadata = parseMetadata(opts.metadata);
        const { scope, service } = skillService(ctx);
        const file = managedSkillFile(scope, name, ctx.super === true);
        const node = new SkillNode(file);
        await service.create(node, {
          name,
          description: opts.description,
          body: opts.body ?? "",
          ...(metadata ? { metadata } : {}),
        });
        ctx.result = succeed({
          command: "skills.create",
          name,
          path: relPath(scope, file),
        });
      } catch (error) {
        failSkill(ctx, error);
      }
    });
}
