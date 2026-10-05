/** Three-way structural reconciliation for dirty aliases, before their snapshots advance. */
import { isDeepStrictEqual as equal } from "node:util";
import { BaseNode, InternalNode } from "../models/index.js";
import { serializeDocument } from "../utils/markdown/document.js";
import { mergeText } from "./node-text-merge.js";
import type { Model } from "./node-layout.js";
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
function mergeStructure(
  base: InternalNode,
  dirty: InternalNode,
  committed: InternalNode,
): InternalNode {
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
  return draft;
}

function mapping(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}
/** YAML maps merge recursively; arrays, dates and scalars are atomic values. */
function mergeValue(
  base: unknown,
  dirty: unknown,
  committed: unknown,
  file: string,
  field: string,
): unknown {
  if (equal(committed, base) || equal(dirty, committed)) return dirty;
  if (equal(dirty, base)) return committed;
  if (
    mapping(dirty) &&
    mapping(committed) &&
    (base === undefined || mapping(base))
  ) {
    const before = (base ?? {}) as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const key of new Set([
      ...Object.keys(before),
      ...Object.keys(dirty),
      ...Object.keys(committed),
    ])) {
      const value = mergeValue(
        before[key],
        dirty[key],
        committed[key],
        file,
        field + "." + key,
      );
      if (value !== undefined)
        Object.defineProperty(result, key, {
          value,
          enumerable: true,
          writable: true,
          configurable: true,
        });
    }
    return result;
  }
  return choose(base, dirty, committed, file, field);
}
export function mergeNode(
  base: BaseNode,
  dirty: BaseNode,
  committed: BaseNode,
): string {
  let draft: BaseNode;
  if (
    base instanceof InternalNode &&
    dirty instanceof InternalNode &&
    committed instanceof InternalNode
  ) {
    draft = mergeStructure(base, dirty, committed);
    // Replay only committed structure on the old source. Its difference from
    // the committed body is authored text/syntax, not the modeled delta.
    const structuralBaseline = mergeStructure(base, base, committed);
    draft.body = mergeText(
      structuralBaseline.body,
      draft.body,
      committed.body,
      dirty.path,
    );
  } else {
    draft = new (dirty.constructor as Model)(dirty.path).parse(
      dirty.serialize(),
    );
    draft.body = mergeText(base.body, dirty.body, committed.body, dirty.path);
  }
  const metadata = mergeValue(
    base.metadata,
    dirty.metadata,
    committed.metadata,
    dirty.path,
    "metadata",
  ) as Record<string, unknown> | undefined;
  // Parse the complete merged document once, preserving absent frontmatter and
  // allowing extension validators to inspect the complete metadata mapping.
  draft.parse(serializeDocument({ metadata, body: draft.body }));
  draft.validate();
  return draft.serialize();
}
