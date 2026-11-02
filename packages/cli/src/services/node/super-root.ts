import path from "node:path";
import { listHarnessMaterialAbsPaths } from "../../domain/config/edges-materials.js";
import { ENTRY_NAMES } from "../../domain/config/layout.js";
import { SuperAgentsNode } from "../../domain/models/index.js";

/**
 * Runtime SuperAgentsNode.
 * Mount existing configured materials relative to scope, matching --super writes.
 */
export function createSuperAgentsNode(scopePath: string): SuperAgentsNode {
  const scopeDir = path.basename(scopePath) === ENTRY_NAMES.internal
    ? path.dirname(path.resolve(scopePath))
    : path.resolve(scopePath);
  const mounts = listHarnessMaterialAbsPaths(scopeDir).map(({ absPath }) => ({ id: absPath }));
  return new SuperAgentsNode(scopeDir, mounts);
}
