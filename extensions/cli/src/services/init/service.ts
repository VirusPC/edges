import { existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { placeHarnessMaterial } from "../../domain/config/harness-materials.js";
import { AgentsNode } from "../../domain/models/internal/agents-node.js";
import { ReadmeNode } from "../../domain/models/readme/readme-node.js";
import type { ChildGroup } from "../../domain/models/core/types.js";
import { parseDocument } from "../../utils/markdown/document.js";
import { NodeService } from "../node/node-service.js";
import {
  findIndexAnchor,
  syncIndexEntry,
  syncTargetAgents,
} from "../memory/agents.js";
import { loadAgentsTemplate } from "../memory/blocks.js";
import { refreshIndex, typeIndexNode } from "../memory/entries.js";
import { assertPrivateIgnored } from "../memory/ignore.js";
import {
  AGENTS_FILE_NAME,
  assertScopePath,
  memoryDir,
  rejectLegacy,
  resolveRoot,
  resolveTarget,
} from "../memory/paths.js";
import { memoryNodes, prepareMemoryWrite } from "../memory/service.js";
import { readIndexTemplate } from "../memory/templates.js";
import {
  MEMORY_TYPE_NAMES,
  SKILL_TYPE_NAMES,
  ensureTypeGitignore,
  findGitRoot,
  layerTypeSpecs,
  seedSpec,
  typeIndexTemplateName,
  type TypeSpec,
} from "../memory/types.js";
import type { InitMemoryOptions } from "../memory/init.js";
import {
  DEFAULT_INIT_MODULES,
  DEFAULT_PUBLIC_MEMORY_TYPES,
  HARNESS_BOARD_MODULES,
  INIT_MODULE_NAMES,
  TYPE_MATERIAL_IDS,
  harnessBoardSeed,
  type HarnessBoardModule,
  type InitModuleName,
} from "./modules.js";

export type { InitMemoryOptions };

export interface InitScopeOptions {
  targetDir: string;
  rootDir?: string;
  description?: string;
  indexGroup?: ChildGroup;
  modules?: readonly string[];
  memoryTypes?: readonly string[];
  skillTypes?: readonly string[];
}

function indexPathForSpec(target: string, spec: TypeSpec): string {
  const materialId = TYPE_MATERIAL_IDS[spec.name];
  if (materialId) return placeHarnessMaterial(target, materialId).absPath;
  return join(target, spec.indexFile);
}

function assertKnownModules(modules: readonly string[]): InitModuleName[] {
  const seen = new Set<string>();
  const out: InitModuleName[] = [];
  for (const name of modules) {
    if (!(INIT_MODULE_NAMES as readonly string[]).includes(name)) {
      throw new Error(`Unknown init module: ${name}`);
    }
    if (seen.has(name)) continue;
    seen.add(name);
    out.push(name as InitModuleName);
  }
  return out;
}

async function ensureHarnessBoard(
  target: string,
  board: HarnessBoardModule,
  service: NodeService,
): Promise<"created" | "preserved"> {
  const file = placeHarnessMaterial(target, board.materialId).absPath;
  if (existsSync(file)) return "preserved";
  await service.create(new ReadmeNode(file), {
    name: board.title,
    description: board.description,
    body: harnessBoardSeed(board.title),
  });
  return "created";
}

async function ensureHarnessBoards(
  target: string,
  modules: readonly string[],
  service: NodeService,
): Promise<{ created: string[]; preserved: string[] }> {
  const created: string[] = [];
  const preserved: string[] = [];
  for (const board of HARNESS_BOARD_MODULES) {
    if (!modules.includes(board.module)) continue;
    const rel = relative(target, placeHarnessMaterial(target, board.materialId).absPath);
    if ((await ensureHarnessBoard(target, board, service)) === "created") created.push(rel);
    else preserved.push(rel);
  }
  return { created, preserved };
}

async function openScope(options: InitMemoryOptions) {
  const target = resolveTarget(options.targetDir);
  const root = resolveRoot(target, options.rootDir);
  rejectLegacy(target);
  if (target !== root) {
    rejectLegacy(root);
    assertScopePath(join(root, AGENTS_FILE_NAME), root);
  }
  loadAgentsTemplate();
  return { target, root };
}

type MemoryInitSelection = {
  operation: "init";
  targetDir: string;
  selectionRequired: true;
  recommendations: {
    modules: string[];
    memoryTypes: string[];
    skillTypes: string[];
  };
};

type MemoryInitWritten = {
  operation: "init";
  targetDir: string;
  memoryDir: string;
  agentsMd: string;
  agentsAction: string;
  rootDir: string;
  rootAgentsMd: string;
  indexAnchor: string;
  indexAction: string;
  indexEntry: string | null;
  indexDescription: string | null;
  inheritedEntries: [];
  detachedEntries: [];
  created: string[];
  preserved: string[];
  selectionRequired: false;
  complete: boolean;
  diagnostics: { code: string; type: string; message: string }[];
};

type MemoryInitResult = MemoryInitSelection | MemoryInitWritten;

/** Memory compatibility package: same notes/projects stubs as `edges init notes|projects`. */
export async function initMemory(options: InitMemoryOptions): Promise<MemoryInitResult> {
  return runMemoryInit(options, true);
}

async function runMemoryInit(options: InitMemoryOptions, compatBoards: boolean): Promise<MemoryInitResult> {
  const { target, root } = await openScope(options);
  const specs = new Map(layerTypeSpecs(target).map((spec) => [spec.name, spec]));
  if (
    !specs.size &&
    options.memoryTypes === undefined &&
    options.skillTypes === undefined
  ) {
    return {
      operation: "init",
      targetDir: target,
      selectionRequired: true,
      recommendations: {
        modules: ["memory", "skills", "tasks", "projects", "notes"],
        memoryTypes: [...MEMORY_TYPE_NAMES],
        skillTypes: [...SKILL_TYPE_NAMES],
      },
    };
  }
  for (const [module, selected, allowed] of [
    ["memory", options.memoryTypes, MEMORY_TYPE_NAMES],
    ["skills", options.skillTypes, SKILL_TYPE_NAMES],
  ] as const) {
    for (const name of selected ?? []) {
      if (!(allowed as readonly string[]).includes(name)) {
        throw new Error(`Unknown ${module} type: ${name}; register custom types with add-type`);
      }
      if (!specs.has(name)) specs.set(name, seedSpec(name));
    }
  }
  if (!specs.size) throw new Error("Select at least one memory or skill type");
  assertScopePath(join(target, AGENTS_FILE_NAME), target);
  for (const spec of specs.values()) assertScopePath(indexPathForSpec(target, spec), target);
  const anchor = findIndexAnchor(target, root);
  if (anchor !== target) {
    const owner = await memoryNodes(anchor).get(join(anchor, AGENTS_FILE_NAME), AgentsNode);
    if (
      owner &&
      !owner.children.some((ref) => ref.id === join(target, AGENTS_FILE_NAME)) &&
      !options.indexGroup
    ) {
      throw new Error("New owner registration requires --index-group local|descendant");
    }
  }
  const service = memoryNodes(target);
  const created: string[] = [];
  const preserved: string[] = [];
  const diagnostics: { code: string; type: string; message: string }[] = [];
  for (const spec of specs.values()) {
    const gitRoot = findGitRoot(target);
    if (spec.gitignore && gitRoot) {
      ensureTypeGitignore(gitRoot, spec.name, spec.module, spec.indexFile);
    }
    const file = indexPathForSpec(target, spec);
    if (spec.gitignore) assertPrivateIgnored(gitRoot ?? target, [file], [dirname(file)]);
    const entry = prepareMemoryWrite(target, file);
    const node = await service.get(entry);
    if (node) preserved.push(spec.indexFile);
    else {
      await service.create(
        typeIndexNode(entry),
        parseDocument(
          readIndexTemplate(typeIndexTemplateName(spec.name), spec.name, spec.description, {
            module: spec.module,
            format: spec.format,
            writable: String(spec.writable),
            gitignore: String(spec.gitignore),
          }),
        ),
        { indexGroup: "local" },
      );
      created.push(spec.indexFile);
    }
  }
  for (const name of specs.keys()) {
    try {
      await refreshIndex(target, name, service);
    } catch (error) {
      diagnostics.push({
        code: "source-scan-error",
        type: name,
        message: String(error instanceof Error ? error.message : error),
      });
    }
  }
  const agentsAction = await syncTargetAgents(target, root, service);
  if (compatBoards) await ensureHarnessBoards(target, ["projects", "notes"], service);
  if (target !== root && existsSync(join(root, AGENTS_FILE_NAME)) && layerTypeSpecs(root).length) {
    await syncTargetAgents(root, root);
  }
  const [indexAction, indexEntry, indexDescription] = await syncIndexEntry(
    anchor,
    target,
    options.description,
    options.indexGroup,
  );
  return {
    operation: "init",
    targetDir: target,
    memoryDir: memoryDir(target),
    agentsMd: join(target, AGENTS_FILE_NAME),
    agentsAction,
    rootDir: root,
    rootAgentsMd: join(root, AGENTS_FILE_NAME),
    indexAnchor: anchor,
    indexAction,
    indexEntry,
    indexDescription,
    inheritedEntries: [],
    detachedEntries: [],
    created,
    preserved,
    selectionRequired: false,
    complete: !diagnostics.length,
    diagnostics,
  };
}

/** Notes/projects (and any non-memory module list) still create the scope AGENTS.md. */
async function ensureScopeEntry(options: InitMemoryOptions) {
  const { target, root } = await openScope(options);
  assertScopePath(join(target, AGENTS_FILE_NAME), target);
  const anchor = findIndexAnchor(target, root);
  if (anchor !== target) {
    const owner = await memoryNodes(anchor).get(join(anchor, AGENTS_FILE_NAME), AgentsNode);
    if (
      owner &&
      !owner.children.some((ref) => ref.id === join(target, AGENTS_FILE_NAME)) &&
      !options.indexGroup
    ) {
      throw new Error("New owner registration requires --index-group local|descendant");
    }
  }
  const service = memoryNodes(target);
  const agentsAction = await syncTargetAgents(target, root, service);
  const [indexAction, indexEntry, indexDescription] = await syncIndexEntry(
    anchor,
    target,
    options.description,
    options.indexGroup,
  );
  return {
    targetDir: target,
    agentsAction,
    indexAction,
    indexEntry,
    indexDescription,
    service,
  };
}

export async function initScope(options: InitScopeOptions) {
  const requested =
    options.modules === undefined || options.modules.length === 0
      ? [...DEFAULT_INIT_MODULES]
      : assertKnownModules(options.modules);
  if (requested.length === 0) throw new Error("Select at least one init module");
  if (
    (options.memoryTypes !== undefined || options.skillTypes !== undefined) &&
    !requested.includes("memory")
  ) {
    throw new Error("Type flags require the memory module");
  }

  if (requested.includes("memory")) {
    const memoryResult = await runMemoryInit(
      {
        targetDir: options.targetDir,
        rootDir: options.rootDir,
        description: options.description,
        indexGroup: options.indexGroup,
        memoryTypes: options.memoryTypes ?? [...DEFAULT_PUBLIC_MEMORY_TYPES],
        skillTypes: options.skillTypes,
      },
      false,
    );
    if (memoryResult.selectionRequired) return { ...memoryResult, modules: requested };
    const boards = await ensureHarnessBoards(
      memoryResult.targetDir,
      requested,
      memoryNodes(memoryResult.targetDir),
    );
    return {
      ...memoryResult,
      modules: requested,
      created: [...memoryResult.created, ...boards.created],
      preserved: [...memoryResult.preserved, ...boards.preserved],
    };
  }

  const scope = await ensureScopeEntry(options);
  const boards = await ensureHarnessBoards(scope.targetDir, requested, scope.service);
  return {
    targetDir: scope.targetDir,
    agentsAction: scope.agentsAction,
    indexAction: scope.indexAction,
    indexEntry: scope.indexEntry,
    indexDescription: scope.indexDescription,
    modules: requested,
    created: boards.created,
    preserved: boards.preserved,
  };
}
