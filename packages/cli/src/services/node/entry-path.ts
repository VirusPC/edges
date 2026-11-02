import { existsSync } from "node:fs";
import { join } from "node:path";
import { ENTRY_NAMES, LEAF_ENTRY_NAMES } from "../../domain/config/layout.js";

/** Read existing legacy spelling; new entries still use the canonical filename. */
export function leafEntryPath(directory: string): string {
  return LEAF_ENTRY_NAMES.map((name) => join(directory, name)).find(existsSync)
    ?? join(directory, ENTRY_NAMES.leaf);
}
