import { relative, sep } from "node:path";
import { MATERIAL_TYPES, type MaterialTypeId } from "../config/material-types.js";

/** Resolve initialized official material types from the scope README's local index. */
export function getInitializedConstraintTypes(
  localChildIds: readonly string[],
  harnessRoot: string,
): MaterialTypeId[] {
  const registered = new Set<string>();
  for (const id of localChildIds) {
    const path = relative(harnessRoot, id);
    if (path === ".." || path.startsWith(`..${sep}`) || path.startsWith(sep)) continue;
    registered.add(path);
  }
  return MATERIAL_TYPES
    .filter((type) => [...registered].some((path) => path.startsWith(`${type.directory}${sep}`)))
    .map((type) => type.id);
}
