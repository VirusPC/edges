import { existsSync, readdirSync, readFileSync } from "node:fs";
import { isAbsolute, join, relative } from "node:path";
import { ENTRY_NAMES } from "../../domain/config/layout.js";
import { isHarnessComposeDir, isScopeModuleDir } from "../../domain/config/exclude.js";
import { isProjectHarnessAgentsFile } from "../../domain/models/agents/harness-agents.js";
import { ComposeReadmeNode, composeReadmePath } from "../../domain/models/compose/compose-readme-node.js";
import { identifyNodeType } from "../../domain/models/node/layout.js";
import { leafEntryPath } from "./entry-path.js";

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
  const files = [composeReadmePath(scopeDir), composeReadmePath(scopeDir, { super: true })];
  if (identifyNodeType(leafEntryPath(scopeDir)) === "project")
    files.push(composeReadmePath(scopeDir, { project: scopeDir }));
  return files.flatMap((file) => {
    if (!existsSync(file)) return [];
    try {
      return new ComposeReadmeNode(file).parse(readFileSync(file, "utf8")).entries().map((entry) => entry.directory);
    } catch { return []; }
  });
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
  const stack = [{ dir: scopeDir, materialScope: scopeDir }];
  while (stack.length) {
    const current = stack.pop()!;
    const { dir } = current;
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    const entryPath = join(dir, ENTRY_NAMES.internal);
    const isSystem = entries.some((entry) => entry.isFile() && entry.name === ENTRY_NAMES.internal) && isSystemEntry(entryPath);
    const materialScope = isSystem ? dir : current.materialScope;
    if (isSystem) roots.push(entryPath);
    if (exclude?.has("compose") && dir !== scopeDir && (isSystem ||
        (isScopeModuleDir(dir, "compose", materialScope) && identifyNodeType(leafEntryPath(dir)) === "project"))) {
      composed.push(...composedDirectories(dir));
    }
    for (const entry of entries) {
      const abs = join(dir, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        if (SKIP_DIR_NAMES.has(entry.name)) continue;
        if (isHarnessComposeDir(dir, entry.name)) {
          const scopeCompose = isScopeModuleDir(dir, entry.name, scopeDir);
          // Only the scope's own compose directory is part of this forest, and only by default.
          if (!scopeCompose || exclude?.has("compose")) continue;
        } else if (exclude?.has(entry.name) && isScopeModuleDir(dir, entry.name, materialScope)) {
          continue;
        }
        if (composed.some((checkout) => inDirectory(abs, checkout))) continue;
        stack.push({ dir: abs, materialScope });
        continue;
      }
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
