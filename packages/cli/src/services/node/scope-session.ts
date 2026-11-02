import { leafEntryPath } from "./entry-path.js";
import path from "node:path";
import { gitRoot, resolveScope } from "../scope.js";
import { NodeService } from "./node-service.js";
import type { MaterialOptions } from "../../domain/config/edges-materials.js";
import { buildSystemForest } from "./system-forest-service.js";
import { scopeTraversal } from "../../domain/operations/traverse.js";

export type MaterialReach = MaterialOptions & { all?: boolean; exclude?: ReadonlySet<string> };

export type NodeSession = {
  scope: string;
  managedRoot: string;
  service: NodeService;
};

/** Open NodeService for the CLI scope. Writes stay on this facade. */
export function openNodeSession(env: NodeJS.ProcessEnv): NodeSession {
  const scope = resolveScope(env);
  const managedRoot = gitRoot(scope) ?? scope;
  return { scope, managedRoot, service: new NodeService({ managedRoot }) };
}

export function scopeRelativePath(scope: string, file: string): string {
  return path.relative(scope, file).split(path.sep).join("/");
}

/** Select composition first; --all also discovers independent systems below it. */
export async function queryMaterialNodes(
  scope: string,
  service: NodeService,
  types: readonly string[],
  reach: MaterialReach,
) {
  const root = reach.project ?? scope;
  const options = { types, exclude: reach.exclude, scopeDir: root };
  const nodes = reach.project
    ? await service.query(leafEntryPath(root), options).value()
    : reach.all ? [] : await service.query(root, { ...options, ...scopeTraversal(reach) }).value();
  if (reach.all) {
    nodes.push(...(await buildSystemForest(root, {
      includeSuper: !reach.project && reach.super === true,
      exclude: reach.exclude,
      form: "independent",
    })).flat().filter((node) => types.includes(node.type)));
  }
  return [...new Map(nodes.map((node) => [node.path, node])).values()];
}
