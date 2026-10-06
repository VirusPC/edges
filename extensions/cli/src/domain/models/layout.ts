import { basename, dirname, join, resolve } from "node:path";
import { TASK_STATUSES } from "./tasks/types.js";
export const ENTRY_NAMES = {
  internal: "AGENTS.md",
  skill: "SKILL.md",
  leaf: "index.md",
} as const;
export const INTERNAL_SECTIONS = {
  constraints: { heading: "本层硬约束", marker: "project-harness-constraints" },
  localChildren: { heading: "本层系统维护信息", marker: "project-harness-local" },
  descendantChildren: {
    heading: "下层系统维护信息",
    marker: "project-harness-descendants",
  },
} as const;
export const CODEC_SECTIONS = {
  constraints: INTERNAL_SECTIONS.constraints,
  memory: INTERNAL_SECTIONS.localChildren,
  children: INTERNAL_SECTIONS.descendantChildren,
} as const;
export const INDEX_MARKERS = {
  type: "project-memory-type",
  entries: "project-memory-entries",
} as const;
export type NodeType =
  "internal" | "skill" | "task" | "memory" | "note" | "leaf" | (string & {});
export interface DirectoryContract {
  module?: string;
  format?: string;
  name?: string;
}
export type DirectoryClassifier = (
  entryPath: string,
  contract?: DirectoryContract,
) => NodeType | undefined;
const classifiers: DirectoryClassifier[] = [
  (_entry, contract) => (contract?.module === "memory" ? "memory" : undefined),
  (entry) =>
    new RegExp(
      `(?:^|/)tasks/(?:[^/]+/)*(?:${TASK_STATUSES.join("|")})/[^/]+/index\\.md$`,
    ).test(entry)
      ? "task"
      : undefined,
  (entry) =>
    /(?:^|\/)notes\/(?:[^/]+\/)+index\.md$/.test(entry) ? "note" : undefined,
];
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
  if (filename === ENTRY_NAMES.internal) return "internal";
  if (filename === ENTRY_NAMES.skill) return "skill";
  if (filename !== ENTRY_NAMES.leaf) return undefined;
  for (const classify of classifiers) {
    const type = classify(entryPath, contract);
    if (type !== undefined) return type;
  }
  return "leaf";
}
export function harnessPath(entryPath: string): string {
  return join(
    dirname(entryPath),
    ...(basename(entryPath) === ENTRY_NAMES.internal
      ? [".harness", ENTRY_NAMES.internal]
      : [ENTRY_NAMES.internal]),
  );
}
/** IO callers supply whether another content entry occupies this directory. */
export function lifecycleUnits(
  entryPath: string,
  coLocatedContent = false,
): readonly string[] {
  return basename(entryPath) === ENTRY_NAMES.internal && coLocatedContent
    ? [entryPath, join(dirname(entryPath), ".harness")]
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

/** Exclude ordinary navigation before applying strict child-path decoding. */
export function resolveEntryHref(
  entryPath: string,
  href: string,
): string | undefined {
  const pathname = href.split(/[?#]/, 1)[0]!;
  let filename: string;
  try {
    filename = basename(decodeURIComponent(basename(pathname)));
  } catch {
    return undefined;
  }
  if (!(Object.values(ENTRY_NAMES) as string[]).includes(filename))
    return undefined;
  return resolveHref(entryPath, href);
}
