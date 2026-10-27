/** Entry filenames and the leaf-directory rules that use them. */

export const ENTRY_NAMES = {
  internal: "AGENTS.md",
  readme: "README.md",
  skill: "SKILL.md",
  leaf: "INDEX.md",
} as const;

/**
 * Default Compose checkout root when `edges compose add` omits `--path`.
 * Relative to the scope directory; each entry is a git submodule at
 * `.edges/compose/<name>`. The module entry is `.edges/compose/README.md`.
 */
export const COMPOSED_CHECKOUT_ROOT = ".edges/compose";

/** Pre-migration spelling of the leaf entry; still read everywhere, never created. */
export const LEGACY_LEAF_ENTRY = "index.md";

export const LEAF_ENTRY_NAMES: readonly string[] = [
  ENTRY_NAMES.leaf,
  LEGACY_LEAF_ENTRY,
];

/** Old persisted spellings. New writes use agents and text. */
export const LEGACY_NODE_TYPES = {
  internal: "agents",
  leaf: "text",
} as const;

/**
 * Leaf INDEX.md rules, checked in this order: memory, routine, task, note, project.
 * Task paths are filled in by the caller because the board directory name comes from harness materials.
 */
export const LEAF_DIRECTORIES = [
  { type: "memory", module: "memory" },
  { type: "routine", path: /(?:^|\/)routines\/[^/]+\/INDEX\.md$/ },
  { type: "task" },
  { type: "note", path: /(?:^|\/)notes\/(?:[^/]+\/)+(?:INDEX|index)\.md$/ },
  {
    type: "project",
    path: /(?:^|\/)(?<!memory\/)projects\/(?:[^/]+\/)+(?:INDEX|index)\.md$/,
  },
] as const;
