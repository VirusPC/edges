import path from "node:path";
import { gitRoot, resolveScope } from "../scope.js";
import { NodeService } from "./node-service.js";

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
