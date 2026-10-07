import path from "node:path";
import type { CliContext } from "../../context.js";
import { materialHarnessRoot } from "../../domain/config/harness-materials.js";
import { SkillNode } from "../../domain/models/skills/skill-node.js";
import { NodeService } from "../../services/node/node-service.js";
import { buildSystemForest } from "../../services/node/system-forest-service.js";
import { gitRoot, resolveScope } from "../../services/scope.js";
import { isWithinPath } from "../../utils/filesystem.js";
import { fail } from "../result.js";

export function failSkill(ctx: CliContext, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  const validation = /not found|must be|ambiguous|already exists|filter must be|metadata must be|owning scope/.test(message);
  ctx.result = fail(
    validation ? "VALIDATION_ERROR" : "UNKNOWN_ERROR",
    message,
    "See edges skills --help for usage.\n",
  );
}

export function skillService(ctx: CliContext): { scope: string; service: NodeService } {
  const scope = resolveScope(ctx.env);
  const managed = gitRoot(scope) ?? scope;
  return { scope, service: new NodeService({ managedRoot: managed }) };
}

export function relPath(scope: string, file: string): string {
  return path.relative(scope, file).split(path.sep).join("/");
}

export function managedSkillFile(scope: string, name: string, superRoot: boolean): string {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) || name.length > 64) {
    throw new Error(`${name}: name must be lowercase kebab-case, 1–64 characters.`);
  }
  const harness = materialHarnessRoot(scope, { super: superRoot });
  return path.join(harness, "skills", "managed", name, "SKILL.md");
}

async function listedSkills(ctx: CliContext): Promise<SkillNode[]> {
  const { scope, service } = skillService(ctx);
  const nodes = ctx.all
    ? (await buildSystemForest(scope, { includeSuper: ctx.super === true, form: "independent" })).flat()
    : await service
      .query(scope, { types: ["skill"], ...(ctx.super ? { super: true as const } : {}) })
      .value();
  return nodes.filter((node): node is SkillNode => node instanceof SkillNode);
}

export async function resolveSkill(ctx: CliContext, target: string): Promise<{
  scope: string;
  service: NodeService;
  node: SkillNode;
}> {
  const { scope, service } = skillService(ctx);
  const managed = gitRoot(scope) ?? scope;
  const looksPath = target.includes("/") || target.endsWith("SKILL.md");
  if (looksPath) {
    const abs = path.resolve(scope, target);
    if (!isWithinPath(abs, managed) || path.basename(abs) !== "SKILL.md") {
      throw new Error(`skill not found: ${target}`);
    }
    const node = await service.get(abs, SkillNode);
    if (!node) throw new Error(`skill not found: ${target}`);
    return { scope, service, node };
  }
  const matches = (await listedSkills(ctx)).filter((node) => node.name === target);
  if (matches.length !== 1) {
    throw new Error(matches.length === 0 ? `skill not found: ${target}` : `skill name is ambiguous: ${target}`);
  }
  const node = await service.get(matches[0]!.path, SkillNode);
  if (!node) throw new Error(`skill not found: ${target}`);
  return { scope, service, node };
}
