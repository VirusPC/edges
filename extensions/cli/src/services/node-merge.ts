/** Three-way structural reconciliation for dirty aliases, before their snapshots advance. */
import { isDeepStrictEqual as equal } from "node:util";
import { InternalNode } from "../models/index.js";
import type { ChildGroup, NodeReference } from "../models/index.js";
import { referenceSuffix, setReferenceSuffix } from "./node-layout.js";
function choose<T>(
  base: T,
  dirty: T,
  committed: T,
  file: string,
  field: string,
): T {
  if (equal(committed, base) || equal(dirty, committed)) return dirty;
  if (equal(dirty, base)) return committed;
  throw new Error(
    `Cached node edit conflict: ${file} (${field}); reload and reconcile unsaved edits`,
  );
}
function references(node: InternalNode) {
  const result = new Map<string, NodeReference & { group: ChildGroup }>();
  for (const group of ["local", "descendant"] as const)
    for (const ref of group === "local"
      ? node.localChildren
      : node.descendantChildren)
      result.set(ref.id, { ...ref, group });
  return result;
}
export function mergeInternal(
  base: InternalNode,
  dirty: InternalNode,
  committed: InternalNode,
): string {
  const draft = new InternalNode(dirty.path).parse(dirty.serialize());
  draft.setConstraints(
    choose(
      base.constraints,
      dirty.constraints,
      committed.constraints,
      dirty.path,
      "constraints",
    ),
  );
  const before = references(base),
    local = references(dirty),
    after = references(committed);
  for (const id of new Set([
    ...before.keys(),
    ...local.keys(),
    ...after.keys(),
  ])) {
    const b = before.get(id),
      d = local.get(id),
      c = after.get(id);
    let merged: typeof d;
    if (b && d && c)
      merged = {
        id,
        group: choose(b.group, d.group, c.group, dirty.path, `${id} group`),
        name: choose(b.name, d.name, c.name, dirty.path, `${id} name`),
        description: choose(
          b.description,
          d.description,
          c.description,
          dirty.path,
          `${id} description`,
        ),
      };
    else merged = choose(b, d, c, dirty.path, id);
    const suffix = choose(
      referenceSuffix(base, id),
      referenceSuffix(dirty, id),
      referenceSuffix(committed, id),
      dirty.path,
      `${id} href suffix`,
    );
    if (!merged) {
      if (d) draft.removeChild(id);
      continue;
    }
    if (!d) draft.addChild(merged.group, merged);
    else {
      draft.moveChild(id, merged.group);
      draft.updateChild(id, {
        name: merged.name,
        description: merged.description,
      });
    }
    setReferenceSuffix(draft, id, suffix ?? "");
  }
  const oldMeta = base.metadata ?? {},
    dirtyMeta = dirty.metadata ?? {},
    newMeta = committed.metadata ?? {};
  for (const key of new Set([
    ...Object.keys(oldMeta),
    ...Object.keys(dirtyMeta),
    ...Object.keys(newMeta),
  ])) {
    const value = choose(
      oldMeta[key],
      dirtyMeta[key],
      newMeta[key],
      dirty.path,
      `metadata.${key}`,
    );
    if (value === undefined) draft.removeMetadata(key);
    else draft.setMetadata(key, value);
  }
  return draft.serialize();
}
