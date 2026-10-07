import path from "node:path";
import { Command } from "commander";
import type { CliContext } from "../../context.js";
import { SkillNode } from "../../domain/models/skills/skill-node.js";
import { fail, succeed } from "../result.js";
import { resolveScope, gitRoot } from "../../services/scope.js";
import { NodeService } from "../../services/node/node-service.js";
import { buildSystemForest } from "../../services/node/system-forest-service.js";

export function addSkillListCommand(skill: Command, ctx: CliContext): void {
  skill.command("list").description("List skills reached by scope traversal").action(async () => {
    try {
      const scope = resolveScope(ctx.env);
      const managed = gitRoot(scope) ?? scope;
      const nodes = ctx.all
        ? (await buildSystemForest(scope, { includeSuper: ctx.super === true, form: "independent" })).flat()
        : await new NodeService({ managedRoot: managed })
          .query(scope, { types: ["skill"], ...(ctx.super ? { super: true as const } : {}) })
          .value();
      ctx.result = succeed({
        command: "skill.list",
        items: nodes.flatMap((node) => node instanceof SkillNode ? [{
          name: node.name,
          path: path.relative(scope, node.path),
        }] : []),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      ctx.result = fail("UNKNOWN_ERROR", message, "See edges skill --help for usage.\n");
    }
  });
}
