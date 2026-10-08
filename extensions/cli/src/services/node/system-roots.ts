import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { isProjectHarnessAgentsFile } from "../../domain/models/internal/harness-agents.js";

const SKIP_DIR_NAMES = new Set([
  "node_modules",
  ".git",
  "dist",
  "coverage",
  ".next",
  ".turbo",
  ".cache",
]);

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
