/**
 * Init module table. Paths are not stored here: catalog rows are material ids,
 * and placeHarnessMaterial is the only reader of harness-materials.json paths.
 * notes is not a child of memory.
 */
export const INIT_MODULE_NAMES = ["memory", "notes", "projects"] as const;

export type InitModuleName = (typeof INIT_MODULE_NAMES)[number];

export const DEFAULT_INIT_MODULES: readonly InitModuleName[] = [
  "memory",
  "notes",
  "projects",
];

/** Public memory types created when `edges init` includes memory and omits --memory-types. */
export const DEFAULT_PUBLIC_MEMORY_TYPES = [
  "feedback",
  "project",
  "reference",
] as const;

/**
 * Official type name to harness-materials id.
 * `user` has no catalog row; custom types keep their TypeSpec index path.
 */
export const TYPE_MATERIAL_IDS: Readonly<Record<string, string>> = {
  feedback: "memory.feedbacks",
  project: "memory.projects",
  reference: "memory.references",
  managed: "skills.managed",
  referenced: "skills.referenced",
};

export type HarnessBoardModule = {
  module: "notes" | "projects";
  materialId: string;
  title: string;
  description: string;
  /** NodeService hangs the new README on the scope AGENTS local block. */
  registration: "scope-agents";
};

/** Fixed order matches the historical memory-init board list: projects, then notes. */
export const HARNESS_BOARD_MODULES: readonly HarnessBoardModule[] = [
  {
    module: "projects",
    materialId: "projects",
    title: "projects",
    description: "项目内容叶子的组织清单。",
    registration: "scope-agents",
  },
  {
    module: "notes",
    materialId: "notes",
    title: "notes",
    description: "笔记内容叶子的组织清单。",
    registration: "scope-agents",
  },
];

export function harnessBoardSeed(title: string): string {
  return `# ${title}\n\n<!-- project-entries-local:start -->\n## 本层内容\n\n<!-- project-entries-local:end -->\n`;
}
