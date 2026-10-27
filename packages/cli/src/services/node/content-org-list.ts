import path from "node:path";
import { ENTRY_NAMES } from "../../domain/config/layout.js";
import { ReadmeNode } from "../../domain/models/readme/readme-node.js";
import { harnessBoardSeed } from "../init/modules.js";
import type { NodeService } from "./node-service.js";

const ENTRIES_MARKER = /^<!-- edges-entries-(?:local|descendants):start -->$/m;

const EMPTY_ENTRIES = `<!-- edges-entries-local:start -->\n## 本层内容\n\n<!-- edges-entries-local:end -->\n`;

export type ContentFolder = "notes" | "projects";

/** `<scope>/notes/README.md` or `<scope>/projects/README.md`. Not the harness placard. */
export function contentOrgListPath(scopeDir: string, folder: ContentFolder): string {
  return path.join(scopeDir, folder, ENTRY_NAMES.readme);
}

/**
 * System-one note/project leaves register here.
 * A missing file is created. Prose without entries markers keeps its text and gains an empty list.
 */
export async function ensureContentOrgList(
  service: NodeService,
  file: string,
  title: string,
): Promise<void> {
  const existing = await service.get(file, ReadmeNode);
  if (!existing) {
    await service.create(new ReadmeNode(file), { body: harnessBoardSeed(title) });
    return;
  }
  if (ENTRIES_MARKER.test(existing.body)) return;
  await service.update(existing, { body: `${existing.body.trimEnd()}\n\n${EMPTY_ENTRIES}` });
}
