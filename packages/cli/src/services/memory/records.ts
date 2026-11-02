import type { MaterialOptions } from "../../domain/config/edges-materials.js";
import { queryMaterialNodes, type MaterialReach } from "../node/scope-session.js";
import { existsSync } from "node:fs";
import { relative } from "node:path";
import { memoryNodes } from "./service.js";
import { resolveTarget } from "./paths.js";
import { resolveMemoryPath } from "./entries.js";

function slugOf(file: string, type: string, skill: boolean): string {
  if (skill) {
    const parts = file.split("/");
    return parts[parts.length - 2] ?? file;
  }
  const base = file.split("/").pop() ?? file;
  const prefix = `${type}_`;
  return base.startsWith(prefix) ? base.slice(prefix.length, -".md".length) : base.replace(/\.md$/, "");
}

export async function listMemoryEntries(
  targetDir: string | undefined,
  type?: string,
  mode: MaterialReach = {},
) {
  const target = resolveTarget(targetDir ?? process.cwd());
  const { NodeService } = await import("../node/node-service.js");
  const { MemoryNode } = await import("../../domain/models/memory/memory-node.js");
  const nodes = await queryMaterialNodes(target, new NodeService({ managedRoot: target }), ["memory"], mode);
  const items = nodes.flatMap((node) => {
    if (!(node instanceof MemoryNode)) return [];
    const memoryType = node.memoryType ?? "";
    if (type && memoryType !== type) return [];
    const rel = relative(target, node.path);
    return [{
      type: memoryType,
      slug: slugOf(rel, memoryType, node.path.endsWith(`${"/"}SKILL.md`)),
      path: rel,
    }];
  });
  return { targetDir: target, items };
}

export async function getMemoryEntry(targetDir: string | undefined, type: string, slug: string, options: MaterialOptions = {}) {
  const target = resolveTarget(targetDir ?? process.cwd());
  const file = resolveMemoryPath(target, type, slug, options);
  const node = await memoryNodes(target, options).get(file);
  if (!node) {
    throw new Error(`memory entry not found: ${type} ${slug}`);
  }
  return {
    targetDir: target,
    type,
    slug,
    path: relative(target, file),
    title: node.name,
    description: node.description,
  };
}

export async function deleteMemoryEntry(targetDir: string | undefined, type: string, slug: string, options: MaterialOptions = {}) {
  const target = resolveTarget(targetDir ?? process.cwd());
  const file = resolveMemoryPath(target, type, slug, options);
  if (!existsSync(file)) {
    throw new Error(`memory entry not found: ${type} ${slug}`);
  }
  const service = memoryNodes(target, options);
  const node = await service.get(file);
  if (!node) {
    throw new Error(`memory entry not found: ${type} ${slug}`);
  }
  await service.destroy(node);
  return { targetDir: target, type, slug, path: relative(target, file) };
}
