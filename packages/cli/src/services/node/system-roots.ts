import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, isAbsolute, join, relative } from "node:path";
import { ENTRY_NAMES } from "../../domain/config/layout.js";
import { isProjectHarnessAgentsFile } from "../../domain/models/agents/harness-agents.js";
import { AgentsNode } from "../../domain/models/index.js";

const SKIP_DIR_NAMES = new Set([
  "node_modules",
  ".git",
  "dist",
  "coverage",
  ".next",
  ".turbo",
  ".cache",
]);

/** `<dir>/.harness/compose`: default home of Compose git submodules (other repos). */
function isComposeCheckoutRoot(dir: string, name: string): boolean {
  return name === "compose" && basename(dir) === ".harness";
}

/** Directories registered in a root's own Compose block. */
function composedDirectories(file: string, source: string): string[] {
  try {
    return new AgentsNode(file).parse(source).composeNode().entries().map((entry) => entry.directory);
  } catch {
    return [];
  }
}

/**
 * Recursively collect AGENTS.md roots that carry project-harness markers. Stable sort.
 * Composed repositories are not part of this repo's forest: `.harness/compose/` and any
 * directory registered in a found root's Compose block are skipped, so a composed repo's
 * own roots (and its Compose entries) never join the scan.
 */
export function collectSystemRoots(scopeDir: string): string[] {
  const composed: string[] = [];
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
        if (isComposeCheckoutRoot(dir, entry.name)) continue;
        stack.push(abs);
        continue;
      }
      if (!entry.isFile() || entry.name !== ENTRY_NAMES.internal) continue;
      let source: string;
      try {
        source = readFileSync(abs, "utf8");
      } catch {
        continue;
      }
      if (isProjectHarnessAgentsFile(abs, source)) {
        roots.push(abs);
        composed.push(...composedDirectories(abs, source));
      }
    }
  }
  const inComposed = (file: string) =>
    composed.some((dir) => {
      const rel = relative(dir, file);
      return rel !== "" && !rel.startsWith("..") && !isAbsolute(rel);
    });
  return roots.filter((file) => !inComposed(file)).sort((a, b) => a.localeCompare(b));
}

export function isSystemEntry(absPath: string): boolean {
  if (!existsSync(absPath)) return false;
  try {
    return isProjectHarnessAgentsFile(absPath, readFileSync(absPath, "utf8"));
  } catch {
    return false;
  }
}
