import {
  createDatedLeaf,
  deleteDatedLeaf,
  getDatedLeaf,
  listDatedLeaves,
  PROJECT_LEAF,
  updateDatedLeaf,
  type DatedLeafFields,
  type DatedLeafItem,
  type DatedLeafView,
  type LeafReach,
} from "../node/dated-leaf.js";
import { initScope, type InitScopeOptions } from "../init/service.js";

export type { DatedLeafFields as ProjectFields, LeafReach as ProjectReach };
export { presentListed } from "../list-query.js";

export function createProject(
  env: NodeJS.ProcessEnv,
  input: DatedLeafFields,
): Promise<{ path: string; title: string }> {
  return createDatedLeaf(env, PROJECT_LEAF, input);
}

export function getProject(env: NodeJS.ProcessEnv, entryPath: string): Promise<DatedLeafView> {
  return getDatedLeaf(env, PROJECT_LEAF, entryPath);
}

export function updateProject(
  env: NodeJS.ProcessEnv,
  entryPath: string,
  input: DatedLeafFields,
): Promise<{ path: string; title: string }> {
  return updateDatedLeaf(env, PROJECT_LEAF, entryPath, input);
}

export function deleteProject(env: NodeJS.ProcessEnv, entryPath: string): Promise<{ path: string }> {
  return deleteDatedLeaf(env, PROJECT_LEAF, entryPath);
}

export function listProjects(env: NodeJS.ProcessEnv, reach: LeafReach): Promise<DatedLeafItem[]> {
  return listDatedLeaves(env, PROJECT_LEAF, reach);
}

export function initProjects(options: Omit<InitScopeOptions, "modules">) {
  return initScope({ ...options, modules: ["projects"] });
}
