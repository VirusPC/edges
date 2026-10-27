import { existsSync, readdirSync, readFileSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";
import { ENTRY_NAMES } from "../../domain/config/layout.js";
import { isHarnessComposeDir, isScopeModuleDir } from "../../domain/config/exclude.js";
import { isProjectHarnessAgentsFile } from "../../domain/models/agents/harness-agents.js";
import { ComposeReadmeNode, composeReadmePath } from "../../domain/models/compose/compose-readme-node.js";

const SKIP_DIR_NAMES = new Set([
  "node_modules",
  ".git",
  "dist",
  "coverage",
  ".next",
  ".turbo",
  ".cache",
]);

/** Checkout directories registered on this scope's compose entry. */
function composedDirectories(scopeDir: string): string[] {
  const file = composeReadmePath(scopeDir);
  if (!existsSync(file)) return [];
  try {
    return new ComposeReadmeNode(file).parse(readFileSync(file, "utf8")).entries().map((entry) => entry.directory);
  } catch {
    return [];
  }
}

function inDirectory(file: string, dir: string): boolean {
  const rel = relative(dir, file);
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

/**
 * Recursively collect AGENTS.md roots that carry edges markers. Stable sort.
 * The scope's own `.edges/compose/` is scanned unless `exclude` contains `compose`.
 * A composed repository's own `.edges/compose/` is never scanned (no recursive Compose).
 * `--exclude <module>` also skips that module directory under the scope.
 */
export function collectSystemRoots(scopeDir: string, exclude?: ReadonlySet<string>): string[] {
  const composed = exclude?.has("compose") ? composedDirectories(scopeDir) : [];
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
        if (isHarnessComposeDir(dir, entry.name)) {
          const scopeCompose = resolve(dir) === resolve(join(scopeDir, ".edges"));
          // Only the scope's own compose directory is part of this forest, and only by default.
          if (!scopeCompose || exclude?.has("compose")) continue;
        } else if (exclude?.has(entry.name) && isScopeModuleDir(dir, entry.name, scopeDir)) {
          continue;
        }
        if (composed.some((checkout) => inDirectory(abs, checkout))) continue;
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
