import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { decodeBody } from "../models/internal/parse.js";

const SKIP_DIR_NAMES = new Set([
  "node_modules",
  ".git",
  "dist",
  "coverage",
  ".next",
  ".turbo",
  ".cache",
]);

const HARNESS_START =
  /<!--\s+(project-harness-constraints|project-harness-local|project-harness-descendants|project-memory-important|project-memory-local|project-memory-children):start\s+-->/;

/** True when path is AGENTS.md and body carries a project-harness (or legacy memory) layer. */
export function isProjectHarnessAgentsFile(absPath: string, source: string): boolean {
  if (basename(absPath) !== "AGENTS.md") return false;
  if (HARNESS_START.test(source)) return true;
  const decoded = decodeBody(source);
  return (
    decoded.sections.constraints.present ||
    decoded.sections.memory.present ||
    decoded.sections.children.present
  );
}

/** Recursively collect AGENTS.md roots that carry project-harness markers. Stable sort. */
export function collectSystemRoots(scopeDir: string): string[] {
  const roots: string[] = [];
  const stack = [scopeDir];
  while (stack.length) {
    const dir = stack.pop()!;
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const abs = join(dir, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        if (SKIP_DIR_NAMES.has(entry.name)) continue;
        stack.push(abs);
        continue;
      }
      if (!entry.isFile() || entry.name !== "AGENTS.md") continue;
      let source: string;
      try {
        source = readFileSync(abs, "utf8");
      } catch {
        continue;
      }
      if (isProjectHarnessAgentsFile(abs, source)) roots.push(abs);
    }
  }
  return roots.sort((a, b) => a.localeCompare(b));
}

export function isSystemEntry(absPath: string): boolean {
  if (!existsSync(absPath)) return false;
  try {
    return isProjectHarnessAgentsFile(absPath, readFileSync(absPath, "utf8"));
  } catch {
    return false;
  }
}
