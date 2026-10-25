import path from "node:path";
import { existsSync } from "node:fs";
import { materialHarnessRoot } from "../../domain/config/harness-materials.js";
import { ENTRY_NAMES } from "../../domain/config/layout.js";
import { pathHitsExcludedModule } from "../../domain/config/exclude.js";
import { RoutineNode } from "../../domain/models/routines/routine-node.js";
import { ReadmeNode } from "../../domain/models/readme/readme-node.js";
import { identifyNodeType } from "../../domain/models/node/layout.js";
import { scopeTraversal, type ReachOptions } from "../../domain/operations/traverse.js";
import { isWithinPath } from "../../utils/filesystem.js";
import { parseMetadata } from "../metadata.js";
import {
  initScope,
  ensureScopeReadme,
  ensureScopeReadmePointer,
  linkScopeReadme,
  type InitScopeOptions,
} from "../init/service.js";
import { ensureContentOrgList } from "../node/content-org-list.js";
import { physicalParent } from "../node/node-layout.js";
import { openNodeSession, scopeRelativePath } from "../node/scope-session.js";
import { buildSystemForest } from "../node/system-forest-service.js";

export { presentListed } from "../list-query.js";
export type RoutineReach = ReachOptions;
export type RoutineFields = { description?: string; body?: string; metadata?: string[] };
export type RoutineItem = { name: string; path: string; description: string };

export function routineFile(scope: string, name: string, superRoot = false): string {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) || name.length > 64) {
    throw new Error(`${name}: name must be lowercase kebab-case, 1–64 characters.`);
  }
  return path.join(materialHarnessRoot(scope, { super: superRoot }), "routines", name, ENTRY_NAMES.leaf);
}

function routineOrg(file: string): string {
  return path.join(path.dirname(path.dirname(file)), ENTRY_NAMES.readme);
}

function isRoutineEntry(file: string): boolean {
  return path.basename(file) === ENTRY_NAMES.leaf && identifyNodeType(file) === "routine";
}

async function listedRoutines(env: NodeJS.ProcessEnv, reach: RoutineReach): Promise<RoutineNode[]> {
  if (reach.exclude?.has("routines")) return [];
  const { scope, service } = openNodeSession(env);
  const org = path.join(materialHarnessRoot(scope, { super: reach.super }), "routines", ENTRY_NAMES.readme);
  if (existsSync(path.dirname(org)) && !await service.get(org, ReadmeNode)) {
    throw new Error(`Missing routine organization entry: ${org}`);
  }
  // Routine --super selects the flat module that create --super writes. Shared
  // SuperAgents traversal intentionally prefers .harness/README.md; leave that
  // behavior unchanged and select this module index explicitly. --all adds it
  // to the shared forest, with identity deduplication below.
  const queryOptions = { types: ["routine", "readme", "agents"], exclude: reach.exclude, scopeDir: scope };
  const nodes = reach.all
    ? (await buildSystemForest(scope, { includeSuper: reach.super === true, exclude: reach.exclude, form: "independent" })).flat()
    : reach.super
      ? []
      : await service.query(scope, { ...queryOptions, ...scopeTraversal(reach) }).value();
  if (reach.super && await service.get(org, ReadmeNode)) {
    nodes.push(...await service.query(org, queryOptions).value());
  }
  // Generic traversal permits absent optional references. A registered routine
  // material or definition is required; reads must expose damage, never repair it.
  for (const parent of nodes) {
    for (const child of parent.children) {
      const material = path.basename(child.id) === ENTRY_NAMES.readme && path.basename(path.dirname(child.id)) === "routines";
      if ((!material && !isRoutineEntry(child.id)) || pathHitsExcludedModule(child.id, scope, reach.exclude)) continue;
      if (!await service.get(child.id)) throw new Error(`Missing routine entry: ${child.id}`);
    }
  }
  return [...new Map(nodes.filter((node): node is RoutineNode => node instanceof RoutineNode).map((node) => [node.path, node])).values()];
}

export async function resolveRoutine(env: NodeJS.ProcessEnv, target: string, reach: RoutineReach) {
  const { scope, managedRoot, service } = openNodeSession(env);
  let file: string;
  if (target.includes("/") || target.endsWith(".md")) {
    file = path.resolve(scope, target);
    if (!isWithinPath(file, managedRoot) || !isRoutineEntry(file) || reach.exclude?.has("routines") || pathHitsExcludedModule(file, scope, reach.exclude)) {
      throw new Error(`routine not found: ${target}`);
    }
  } else {
    const matches = (await listedRoutines(env, reach)).filter((node) => node.name === target);
    if (matches.length !== 1) throw new Error(matches.length === 0 ? `routine not found: ${target}` : `routine name is ambiguous: ${target}`);
    file = matches[0]!.path;
    if (!isWithinPath(file, managedRoot)) throw new Error(`routine path escapes managed root: ${target}`);
  }
  const org = routineOrg(file);
  if (!await service.get(org, ReadmeNode)) throw new Error(`Missing routine organization entry: ${org}`);
  // Do not force a RoutineNode onto arbitrary INDEX.md content.
  const node = await service.get(file);
  if (!(node instanceof RoutineNode)) throw new Error(`routine not found: ${target}`);
  return { scope, service, node };
}

export async function createRoutine(
  env: NodeJS.ProcessEnv,
  input: { name: string; description: string; body?: string; metadata?: string[]; super?: boolean },
): Promise<{ name: string; path: string }> {
  if (!input.description.trim()) throw new Error("description must be nonempty");
  const metadata = parseMetadata(input.metadata);
  const { scope, managedRoot, service } = openNodeSession(env);
  const file = routineFile(scope, input.name, input.super === true);
  const org = routineOrg(file);
  if (!input.super) await ensureScopeReadme(scope, service);
  await ensureContentOrgList(service, org, "Routines");
  if (!input.super) {
    await linkScopeReadme(scope, { id: org, name: "Routines", description: "例行任务定义；执行与调度由外部平台负责。" }, service);
    await ensureScopeReadmePointer(scope, service);
  }
  if (physicalParent(file, managedRoot) !== org) throw new Error(`routine must register on ${org}`);
  await service.create(new RoutineNode(file), {
    name: input.name,
    description: input.description,
    body: input.body ?? "",
    ...(metadata ? { metadata } : {}),
  });
  return { name: input.name, path: scopeRelativePath(scope, file) };
}

export async function getRoutine(env: NodeJS.ProcessEnv, target: string, reach: RoutineReach) {
  const { scope, node } = await resolveRoutine(env, target, reach);
  return { name: node.name, path: scopeRelativePath(scope, node.path), description: node.description, body: node.body, metadata: node.metadata };
}

export async function updateRoutine(env: NodeJS.ProcessEnv, target: string, input: RoutineFields, reach: RoutineReach) {
  if (reach.all) throw new Error("--all is only supported by read commands.");
  const metadata = parseMetadata(input.metadata);
  if (input.description === undefined && input.body === undefined && metadata === undefined) throw new Error("update must be --description, --body, or --metadata");
  const { scope, service, node } = await resolveRoutine(env, target, reach);
  if (metadata?.name !== undefined && metadata.name !== node.name) throw new Error("routine name is stable and cannot be updated");
  const updated = await service.update(node, {
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.body !== undefined ? { body: input.body } : {}),
    ...(metadata ? { metadata } : {}),
  });
  return { name: updated.name, path: scopeRelativePath(scope, updated.path) };
}

export async function deleteRoutine(env: NodeJS.ProcessEnv, target: string, reach: RoutineReach) {
  if (reach.all) throw new Error("--all is only supported by read commands.");
  const { scope, service, node } = await resolveRoutine(env, target, reach);
  const file = node.path;
  await service.destroy(node);
  return { path: scopeRelativePath(scope, file) };
}

export function initRoutines(options: Omit<InitScopeOptions, "modules">) {
  return initScope({ ...options, modules: ["routines"] });
}

export async function listRoutines(env: NodeJS.ProcessEnv, reach: RoutineReach): Promise<RoutineItem[]> {
  const { scope } = openNodeSession(env);
  return (await listedRoutines(env, reach)).map((node) => ({ name: node.name!, path: scopeRelativePath(scope, node.path), description: node.description! }));
}
