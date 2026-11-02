import { basename, dirname, join, resolve, sep } from "node:path";
import { harnessMaterialById, loadHarnessMaterialsConfig, tasksBoardDirName } from "../../config/edges-materials.js";
import {
  ENTRY_NAMES,
  LEAF_DIRECTORIES,
  LEAF_ENTRY_NAMES,
  LEGACY_LEAF_ENTRY,
  LEGACY_NODE_TYPES,
} from "../../config/layout.js";
import { TASK_STATUSES } from "../tasks/types.js";

export { ENTRY_NAMES, LEGACY_LEAF_ENTRY, LEAF_ENTRY_NAMES };

export type NodeType =
  "agents" | "readme" | "routine" | "skill" | "task" | "memory" | "note" | "project" | "text" | (string & {});

export const isLeafEntryName = (name: string): boolean =>
  LEAF_ENTRY_NAMES.includes(name);

/** Old spelling of a canonical type, so registries keyed by it keep resolving. */
export function legacyNodeType(type: string): string {
  for (const [old, current] of Object.entries(LEGACY_NODE_TYPES))
    if (current === type) return old;
  return type;
}

/** Old persisted/queried spellings still read; new writes only use agents/text. */
export function normalizeNodeType(type: string): NodeType {
  return LEGACY_NODE_TYPES[type as keyof typeof LEGACY_NODE_TYPES] ?? type;
}

export interface DirectoryContract {
  module?: string;
  format?: string;
  name?: string;
}

export type DirectoryClassifier = (
  entryPath: string,
  contract?: DirectoryContract,
) => NodeType | undefined;

function taskLeafPath(): RegExp {
  const board = tasksBoardDirName().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `(?:^|/)${board}/(?:[^/]+/)*(?:${TASK_STATUSES.join("|")})/[^/]+/(?:INDEX|index)\\.md$`,
  );
}

/** Explicit extensions run before the built-in directory rules. */
const classifiers: DirectoryClassifier[] = [];

/** Only the nearest material boundary can classify a nested content entry. */
function materialEntryType(entryPath: string, contract?: DirectoryContract): NodeType | undefined {
  for (const rule of LEAF_DIRECTORIES)
    if ("module" in rule && contract?.module === rule.module) return rule.type;
  const parts = entryPath.split(sep);
  const modules = new Set(loadHarnessMaterialsConfig().materials.map((material) => material.path.split(sep)[0]));
  for (let index = parts.length - 3; index >= 0; index--) {
    if (!modules.has(parts[index]!)) continue;
    // memory/projects is a Memory Type, not the Project organization module.
    if (parts[index] === "projects" && parts[index - 1] === "memory") return undefined;
    const suffix = parts.slice(index).join("/");
    for (const rule of LEAF_DIRECTORIES) {
      if ("path" in rule && rule.path.test(suffix)) return rule.type;
      if (!("path" in rule) && !("module" in rule) && taskLeafPath().test(suffix)) return "task";
    }
    return undefined;
  }
  return undefined;
}

/** Register a directory contract; return a disposer for scoped registrations. */
export function registerDirectoryClassifier(
  classifier: DirectoryClassifier,
): () => void {
  classifiers.unshift(classifier);
  return () => {
    const index = classifiers.indexOf(classifier);
    if (index >= 0) classifiers.splice(index, 1);
  };
}

export function identifyNodeType(
  entryPath: string,
  contract?: DirectoryContract,
): NodeType | undefined {
  const filename = basename(entryPath);
  if (filename === ENTRY_NAMES.internal) return "agents";
  if (filename === ENTRY_NAMES.readme) return "readme";
  if (filename === ENTRY_NAMES.skill) return "skill";
  if (!isLeafEntryName(filename)) return undefined;
  for (const classify of classifiers) {
    const type = classify(entryPath, contract);
    if (type !== undefined) return type;
  }
  return materialEntryType(entryPath, contract) ?? "text";
}

export function harnessPath(entryPath: string): string {
  return join(
    dirname(entryPath),
    ...(basename(entryPath) === ENTRY_NAMES.internal
      ? [".edges", ENTRY_NAMES.internal]
      : [ENTRY_NAMES.internal]),
  );
}

/** IO callers supply whether another content entry occupies this directory. */
export function lifecycleUnits(
  entryPath: string,
  coLocatedContent = false,
): readonly string[] {
  return basename(entryPath) === ENTRY_NAMES.internal && coLocatedContent
    ? [entryPath, join(dirname(entryPath), ".edges")]
    : [dirname(entryPath)];
}

export function assertMovableLayout(
  entryPath: string,
  coLocatedContent = false,
): void {
  if (basename(entryPath) === ENTRY_NAMES.internal && coLocatedContent)
    throw new Error(
      `${entryPath}: move the co-located content node instead of its AGENTS harness.`,
    );
}

export function resolveHref(
  entryPath: string,
  href: string,
): string | undefined {
  if (
    /^[a-z][a-z\d+.-]*:/i.test(href) ||
    href.startsWith("#") ||
    href.startsWith("//")
  )
    return undefined;
  const pathname = href.split(/[?#]/, 1)[0]!;
  if (!pathname) return undefined;
  try {
    return resolve(dirname(entryPath), decodeURIComponent(pathname));
  } catch {
    throw new Error(`${entryPath}: invalid encoded child href ${href}`);
  }
}

/** Configured tasks material, a README under `.edges/`, or a project org list under the tasks board directory. */
export function isHarnessMaterial(id: string): boolean {
  const tasksPath = harnessMaterialById("tasks").path.split(sep).join("/");
  const norm = id.split(sep).join("/");
  if (norm.endsWith("/" + tasksPath)) return true;
  return (
    basename(id) === ENTRY_NAMES.readme &&
    (dirname(id).split(sep).includes(".edges") ||
      basename(dirname(dirname(id))) === tasksBoardDirName())
  );
}

/** Exclude ordinary navigation before applying strict child-path decoding. */
export function resolveEntryHref(
  entryPath: string,
  href: string,
  includeReadme = false,
): string | undefined {
  const pathname = href.split(/[?#]/, 1)[0]!;
  let filename: string;
  try {
    filename = basename(decodeURIComponent(basename(pathname)));
  } catch {
    return undefined;
  }
  const names = [...Object.values(ENTRY_NAMES), LEGACY_LEAF_ENTRY] as string[];
  if (!names.includes(filename)) return undefined;
  const resolved = resolveHref(entryPath, href);
  if (
    resolved &&
    filename === ENTRY_NAMES.readme &&
    !includeReadme &&
    !isHarnessMaterial(resolved)
  )
    return undefined;
  return resolved;
}
