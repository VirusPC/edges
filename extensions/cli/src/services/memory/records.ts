import { existsSync } from "node:fs";
import { relative } from "node:path";
import { memoryNodes } from "./service.js";
import { resolveTarget } from "./paths.js";
import {
  isSkillFormat,
  memoryEntryTypes,
  resolveMemoryPath,
} from "./entries.js";
import { listTypeFiles } from "./types.js";

function slugOf(file: string, type: string, skill: boolean): string {
  if (skill) {
    const parts = file.split("/");
    return parts[parts.length - 2] ?? file;
  }
  const base = file.split("/").pop() ?? file;
  const prefix = `${type}_`;
  return base.startsWith(prefix) ? base.slice(prefix.length, -".md".length) : base.replace(/\.md$/, "");
}

export async function listMemoryEntries(targetDir: string | undefined, type?: string) {
  const target = resolveTarget(targetDir ?? process.cwd());
  const types = type ? [type] : memoryEntryTypes(target);
  const items: Array<{ type: string; slug: string; path: string }> = [];
  for (const name of types) {
    let files: string[] = [];
    try {
      files = listTypeFiles(target, name, isSkillFormat(target, name) ? "*/SKILL.md" : `${name}_*.md`);
    } catch {
      continue;
    }
    for (const file of files) {
      items.push({
        type: name,
        slug: slugOf(file, name, isSkillFormat(target, name)),
        path: relative(target, file),
      });
    }
  }
  return { targetDir: target, items };
}

export async function getMemoryEntry(targetDir: string | undefined, type: string, slug: string) {
  const target = resolveTarget(targetDir ?? process.cwd());
  const file = resolveMemoryPath(target, type, slug);
  const node = await memoryNodes(target).get(file);
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

export async function deleteMemoryEntry(targetDir: string | undefined, type: string, slug: string) {
  const target = resolveTarget(targetDir ?? process.cwd());
  const file = resolveMemoryPath(target, type, slug);
  if (!existsSync(file)) {
    throw new Error(`memory entry not found: ${type} ${slug}`);
  }
  const service = memoryNodes(target);
  const node = await service.get(file);
  if (!node) {
    throw new Error(`memory entry not found: ${type} ${slug}`);
  }
  await service.destroy(node);
  return { targetDir: target, type, slug, path: relative(target, file) };
}
