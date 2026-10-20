import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { COMPOSED_CHECKOUT_ROOT, ENTRY_NAMES } from "../../domain/config/layout.js";
import { AgentsNode } from "../../domain/models/index.js";
import { isLegacyComposeHref } from "../../domain/models/compose/compose-node.js";
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
    `(edges compose unregister --name ${entry.name}, then edges compose register --name ${entry.name} --remote <url> --description <text>)\n`
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
        `warning: compose entry ${entry.name} is not checked out at ${entry.href}; run edges compose clone --name ${entry.name}\n`,
      );
  }
  return warnings;
}

/** Same hints for the scope AGENTS.md. Never throws; an unreadable scope yields none. */
export function scopeComposeWarnings(env: NodeJS.ProcessEnv): string[] {
  try {
    const file = path.join(resolveScope(env), ENTRY_NAMES.internal);
    if (!existsSync(file)) return [];
    const node = new AgentsNode(file).parse(readFileSync(file, "utf8"));
    return composeEntryWarnings(node.composeNode().entries());
  } catch {
    return [];
  }
}
