import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { ComposeReadmeNode, composeReadmePath, isLegacyComposeHref } from "../../domain/models/compose/compose-readme-node.js";
import { COMPOSED_CHECKOUT_ROOT } from "../../domain/config/layout.js";
import { resolveScope } from "../scope.js";

interface EntryLike {
  name: string;
  href: string;
  directory: string;
}

/** Migration hint for an entry authored as `~/...` or an absolute path. */
export function legacyPathWarning(entry: EntryLike): string | undefined {
  if (!isLegacyComposeHref(entry.href)) return undefined;
  return (
    `warning: compose entry ${entry.name} uses a legacy path ${entry.href}; ` +
    `migrate it to a git submodule at ${COMPOSED_CHECKOUT_ROOT}/${entry.name} ` +
    `(edges compose add --name ${entry.name} --remote <url> --description <text>, without --path, replaces the old line)\n`
  );
}

function notCheckedOut(directory: string): boolean {
  if (!existsSync(directory)) return true;
  try {
    return readdirSync(directory).length === 0;
  } catch {
    return false;
  }
}

/**
 * Read-side hints for the current repo's own Compose entries only (never the entries
 * of a composed repo): legacy paths, and entries whose directory is missing or empty
 * (an uninitialized git submodule).
 */
export function composeEntryWarnings(entries: readonly EntryLike[]): string[] {
  const warnings: string[] = [];
  for (const entry of entries) {
    const legacy = legacyPathWarning(entry);
    if (legacy) warnings.push(legacy);
    if (notCheckedOut(entry.directory))
      warnings.push(
        `warning: compose entry ${entry.name} is not checked out at ${entry.href}; run edges compose update --name ${entry.name}\n`,
      );
  }
  return warnings;
}

/** Same hints for `.harness/compose/README.md`. Never throws; a missing entry yields none. */
export function scopeComposeWarnings(env: NodeJS.ProcessEnv): string[] {
  try {
    const file = composeReadmePath(resolveScope(env));
    if (!existsSync(file)) return [];
    const node = new ComposeReadmeNode(file).parse(readFileSync(file, "utf8"));
    return composeEntryWarnings(node.entries());
  } catch {
    return [];
  }
}
