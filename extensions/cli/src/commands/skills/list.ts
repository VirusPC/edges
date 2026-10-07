import path from "node:path";
import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { SkillNode } from "../../domain/models/skills/skill-node.js";
import { presentListed } from "../../services/list-query.js";
import { buildSystemForest } from "../../services/node/system-forest-service.js";
import { collectRepeat } from "../metadata.js";
import { succeed } from "../result.js";
import { failSkill, skillService } from "./node.js";

export function addSkillListCommand(skill: Command, ctx: CliContext): void {
  skill
    .command("list")
    .description("List skills reached by scope traversal")
    .option("--filter <field=value>", "Repeatable field filter", collectRepeat, [])
    .option("--group-by <field>", "Group filtered skills by one field")
    .action(async (opts: { filter?: string[]; groupBy?: string }) => {
      try {
        const { scope, service } = skillService(ctx);
        const nodes = ctx.all
          ? (await buildSystemForest(scope, { includeSuper: ctx.super === true, form: "independent" })).flat()
          : await service
            .query(scope, { types: ["skill"], ...(ctx.super ? { super: true as const } : {}) })
            .value();
        const items = nodes.flatMap((node) => node instanceof SkillNode ? [{
          name: node.name ?? "",
          path: path.relative(scope, node.path).split(path.sep).join("/"),
          description: node.description ?? "",
        }] : []);
        ctx.result = succeed(presentListed("skills.list", items, opts));
      } catch (error) {
        failSkill(ctx, error);
      }
    });
}
