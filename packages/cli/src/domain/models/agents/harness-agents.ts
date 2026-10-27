import { basename } from "node:path";
import { ENTRY_NAMES } from "../../config/layout.js";
import { decodeBody } from "../node/document.js";

const HARNESS_START =
  /<!--\s+(edges-constraints|edges-local|edges-descendants|edges-compose):start\s+-->/;

/** True when path is AGENTS.md and body carries an edges layer. */
export function isProjectHarnessAgentsFile(absPath: string, source: string): boolean {
  if (basename(absPath) !== ENTRY_NAMES.internal) return false;
  if (HARNESS_START.test(source)) return true;
  const decoded = decodeBody(source);
  return (
    decoded.sections.constraints.present ||
    decoded.sections.memory.present ||
    decoded.sections.children.present ||
    decoded.sections.compose.present
  );
}
