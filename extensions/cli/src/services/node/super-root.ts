import { listHarnessMaterialAbsPaths } from "../../domain/config/harness-materials.js";
import { SuperAgentsNode } from "../../domain/models/index.js";
import path from "node:path";

/** Runtime SuperAgentsNode: mounts existing harness-materials README paths under scope. */
export function createSuperAgentsNode(scopePath: string): SuperAgentsNode {
  const scopeDir = path.basename(scopePath) === "AGENTS.md"
    ? path.dirname(path.resolve(scopePath))
    : path.resolve(scopePath);
  const mounts = listHarnessMaterialAbsPaths(scopeDir).map(({ absPath }) => ({ id: absPath }));
  return new SuperAgentsNode(scopeDir, mounts);
}
