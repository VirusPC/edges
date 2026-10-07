import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { collectRepeat, parseMetadata } from "../metadata.js";
import { succeed } from "../result.js";
import { failSkill, relPath, resolveSkill } from "./node.js";

export function addSkillUpdateCommand(skill: Command, ctx: CliContext): void {
  skill
    .command("update")
    .description("Update a managed skill description, body, or metadata")
    .argument("<target>", "SKILL.md path or skill name")
    .option("--description <text>", "New description")
    .option("--body <markdown>", "New body")
    .option("--metadata <key=value>", "Repeatable frontmatter field", collectRepeat, [])
    .action(async (target: string, opts: { description?: string; body?: string; metadata?: string[] }) => {
      try {
        const metadata = parseMetadata(opts.metadata);
        if (opts.description === undefined && opts.body === undefined && metadata === undefined) {
          throw new Error("update must be --description, --body, or --metadata");
        }
        const { scope, service, node } = await resolveSkill(ctx, target);
        const updated = await service.update(node, {
          ...(opts.description !== undefined ? { description: opts.description } : {}),
          ...(opts.body !== undefined ? { body: opts.body } : {}),
          ...(metadata ? { metadata } : {}),
        });
        ctx.result = succeed({
          command: "skills.update",
          name: updated.name,
          path: relPath(scope, updated.path),
        });
      } catch (error) {
        failSkill(ctx, error);
      }
    });
}
