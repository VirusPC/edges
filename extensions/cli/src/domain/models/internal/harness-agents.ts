import { basename } from "node:path";
import { decodeBody } from "./parse.js";

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
