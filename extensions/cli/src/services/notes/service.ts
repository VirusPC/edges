import {
  createDatedLeaf,
  deleteDatedLeaf,
  getDatedLeaf,
  listDatedLeaves,
  NOTE_LEAF,
  updateDatedLeaf,
  type DatedLeafFields,
  type DatedLeafItem,
  type DatedLeafView,
  type LeafReach,
} from "../node/dated-leaf.js";
import { initScope, type InitScopeOptions } from "../init/service.js";

export type { DatedLeafFields as NoteFields, LeafReach as NoteReach };
export { presentListed } from "../list-query.js";

export function createNote(
  env: NodeJS.ProcessEnv,
  input: DatedLeafFields,
): Promise<{ path: string; title: string }> {
  return createDatedLeaf(env, NOTE_LEAF, input);
}

export function getNote(env: NodeJS.ProcessEnv, entryPath: string): Promise<DatedLeafView> {
  return getDatedLeaf(env, NOTE_LEAF, entryPath);
}

export function updateNote(
  env: NodeJS.ProcessEnv,
  entryPath: string,
  input: DatedLeafFields,
): Promise<{ path: string; title: string }> {
  return updateDatedLeaf(env, NOTE_LEAF, entryPath, input);
}

export function deleteNote(env: NodeJS.ProcessEnv, entryPath: string): Promise<{ path: string }> {
  return deleteDatedLeaf(env, NOTE_LEAF, entryPath);
}

export function listNotes(env: NodeJS.ProcessEnv, reach: LeafReach): Promise<DatedLeafItem[]> {
  return listDatedLeaves(env, NOTE_LEAF, reach);
}

export function initNotes(options: Omit<InitScopeOptions, "modules">) {
  return initScope({ ...options, modules: ["notes"] });
}
