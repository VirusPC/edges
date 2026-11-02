import path from "node:path";
import { projectHasContents } from "../projects/contents.js";
import { materialHarnessRoot, type MaterialOptions } from "../../domain/config/edges-materials.js";
import { BaseNode } from "../../domain/models/index.js";
import { ENTRY_NAMES } from "../../domain/config/layout.js";
import { identifyNodeType, isLeafEntryName } from "../../domain/models/node/layout.js";
import { directoryStem } from "../../domain/models/node/stem.js";
import { NoteNode } from "../../domain/models/notes/note-node.js";
import { ProjectNode } from "../../domain/models/projects/project-node.js";
import { localDateYmd } from "../../utils/date.js";
import { isWithinPath } from "../../utils/filesystem.js";
import { parseMetadata } from "../metadata.js";
import { ReadmeNode } from "../../domain/models/readme/readme-node.js";
import { contentOrgListPath, ensureMaterialOrg } from "./content-org-list.js";
import type { Model } from "./node-layout.js";
import { physicalParent } from "./node-layout.js";
import { openNodeSession, scopeRelativePath, queryMaterialNodes, type MaterialReach } from "./scope-session.js";
import { buildSystemForest, forestScopeOptions } from "./system-forest-service.js";

export type TitledLeaf = BaseNode & { title: string };

export type DatedLeafSpec<T extends TitledLeaf> = {
  folder: "notes" | "projects";
  Model: Model<T>;
  label: "note" | "project";
  queryType: string;
};

export const NOTE_LEAF: DatedLeafSpec<NoteNode> = {
  folder: "notes",
  Model: NoteNode,
  label: "note",
  queryType: "note",
};

export const PROJECT_LEAF: DatedLeafSpec<ProjectNode> = {
  folder: "projects",
  Model: ProjectNode,
  label: "project",
  queryType: "project",
};

export type DatedLeafFields = MaterialOptions & {
  title?: string;
  body?: string;
  metadata?: string[];
};

export type DatedLeafView = {
  path: string;
  title: string;
  body: string;
};

export type DatedLeafItem = {
  stem: string;
  path: string;
  title: string;
};

export type LeafReach = MaterialReach;

export function datedLeafFile<T extends TitledLeaf>(
  scope: string,
  entryPath: string,
  spec: DatedLeafSpec<T>,
  reach: MaterialOptions = {},
): string {
  const abs = path.resolve(scope, entryPath);
  const directory = path.dirname(contentOrgListPath(scope, spec.folder, reach));
  if (
    !isWithinPath(abs, materialHarnessRoot(scope, reach)) ||
    !isLeafEntryName(path.basename(abs)) || identifyNodeType(abs) !== spec.queryType ||
    (reach.super && !reach.project && path.relative(scope, abs).split(path.sep)[0] === ".edges")
  ) {
    throw new Error(`${spec.label} path must be ${scopeRelativePath(scope, directory)}/<stem>/INDEX.md`);
  }
  return abs;
}

const DATED_DIRECTORY_MAX_BYTES = 255;

function titleSlug(title: string, now: Date): string {
  const prefixBytes = Buffer.byteLength(`${localDateYmd(now)}--`);
  return directoryStem(title, {
    lowercase: true,
    fallback: `untitled-${Math.floor(now.getTime() / 1000)}`,
    maxLength: DATED_DIRECTORY_MAX_BYTES - prefixBytes,
    maxLengthUnit: "bytes",
  });
}

function composeLeaf<T extends TitledLeaf>(
  spec: DatedLeafSpec<T>,
  anchor: string,
  title: string | undefined,
  body: string | undefined,
): { markdown: string; title: string } {
  if (title !== undefined && (title.length < 1 || title.length > 120)) {
    throw new Error(`${spec.label} title must be 1–120 characters`);
  }
  const draft = new spec.Model(anchor);
  draft.body = body ?? "";
  if (title !== undefined) draft.title = title;
  if (!draft.title.trim()) throw new Error(`${spec.label} title must be an H1 or --title`);
  if (draft.title.length > 120) throw new Error(`${spec.label} title must be 1–120 characters`);
  return { markdown: draft.body, title: draft.title };
}

async function loadDatedLeaf<T extends TitledLeaf>(
  env: NodeJS.ProcessEnv,
  spec: DatedLeafSpec<T>,
  entryPath: string,
  reach: MaterialOptions,
): Promise<{ scope: string; node: T; file: string; service: ReturnType<typeof openNodeSession>["service"] }> {
  const { scope, service } = openNodeSession(env);
  const file = datedLeafFile(scope, entryPath, spec, reach);
  const node = await service.get(file);
  if (!(node instanceof spec.Model)) throw new Error(`${spec.label} not found: ${entryPath}`);
  return { scope, service, node, file };
}

export async function createDatedLeaf<T extends TitledLeaf>(
  env: NodeJS.ProcessEnv,
  spec: DatedLeafSpec<T>,
  input: DatedLeafFields,
): Promise<{ path: string; title: string }> {
  const { scope, managedRoot, service } = openNodeSession(env);
  const metadata = parseMetadata(input.metadata);
  const composed = composeLeaf(spec, path.join(scope, ENTRY_NAMES.leaf), input.title, input.body);
  const now = new Date();
  const org = contentOrgListPath(scope, spec.folder, input);
  const file = path.join(path.dirname(org), `${localDateYmd(now)}--${titleSlug(composed.title, now)}`, ENTRY_NAMES.leaf);
  await ensureMaterialOrg(service, scope, spec.folder, spec.folder, `${spec.label === "note" ? "笔记" : "项目"}内容的组织清单。`, input);
  const parent = physicalParent(file, managedRoot);
  if (parent !== org) {
    throw new Error(`${spec.label} must register on ${scopeRelativePath(scope, org)}`);
  }
  const node = new spec.Model(file);
  await service.create(node, {
    body: composed.markdown,
    ...(metadata ? { metadata } : {}),
  });
  return { path: scopeRelativePath(scope, file), title: composed.title };
}

export async function getDatedLeaf<T extends TitledLeaf>(
  env: NodeJS.ProcessEnv,
  spec: DatedLeafSpec<T>,
  entryPath: string,
  reach: MaterialOptions = {},
): Promise<DatedLeafView> {
  const { scope, node, file } = await loadDatedLeaf(env, spec, entryPath, reach);
  return { path: scopeRelativePath(scope, file), title: node.title, body: node.body };
}

export async function updateDatedLeaf<T extends TitledLeaf>(
  env: NodeJS.ProcessEnv,
  spec: DatedLeafSpec<T>,
  entryPath: string,
  input: DatedLeafFields,
): Promise<{ path: string; title: string }> {
  const metadata = parseMetadata(input.metadata);
  if (input.title === undefined && input.body === undefined && metadata === undefined) {
    throw new Error("update must be --title, --body, or --metadata");
  }
  const { scope, service, node, file } = await loadDatedLeaf(env, spec, entryPath, input);
  let body = input.body;
  if (input.title !== undefined) {
    if (input.title.length < 1 || input.title.length > 120) {
      throw new Error(`${spec.label} title must be 1–120 characters`);
    }
    const draft = new spec.Model(file).parse(node.serialize());
    if (body !== undefined) draft.body = body;
    draft.title = input.title;
    body = draft.body;
  }
  if (node instanceof ProjectNode && body !== undefined) {
    const draft = new ProjectNode(file);
    draft.body = body;
    draft.update({ localChildren: node.localChildren, descendantChildren: node.descendantChildren }, { operation: "update" });
    body = draft.body;
  }
  const updated = await service.update(node, {
    ...(body !== undefined ? { body } : {}),
    ...(metadata ? { metadata } : {}),
  });
  return { path: scopeRelativePath(scope, file), title: updated.title };
}

export async function deleteDatedLeaf<T extends TitledLeaf>(
  env: NodeJS.ProcessEnv,
  spec: DatedLeafSpec<T>,
  entryPath: string,
  reach: MaterialOptions & { recursive?: boolean } = {},
): Promise<{ path: string }> {
  const { scope, service, node, file } = await loadDatedLeaf(env, spec, entryPath, reach);
  if (node instanceof ProjectNode && !reach.recursive && projectHasContents(scope, file)) {
    throw new Error("Project contains materials or user resources; use --recursive to delete its contents.");
  }
  await service.destroy(node);
  return { path: scopeRelativePath(scope, file) };
}

export async function listDatedLeaves<T extends TitledLeaf>(
  env: NodeJS.ProcessEnv,
  spec: DatedLeafSpec<T>,
  reach: LeafReach,
): Promise<DatedLeafItem[]> {
  if (reach.exclude?.has(spec.folder)) return [];
  const { scope, service } = openNodeSession(env);
  const queryOptions = { types: [spec.queryType], exclude: reach.exclude, scopeDir: scope };
  const nodes = reach.project ? await queryMaterialNodes(scope, service, [spec.queryType], reach) : reach.all
    ? (await buildSystemForest(scope, { includeSuper: reach.super === true, exclude: reach.exclude, form: "independent" })).flat()
    : reach.super ? [] : await service.query(scope, queryOptions).value();
  // Super traversal prefers .edges/README.md; select the flat module explicitly,
  // as routines does. Default and --all use the registered tree without a second scan.
  if (reach.super && !reach.project) {
    const org = contentOrgListPath(scope, spec.folder, reach);
    const options = reach.all ? { ...queryOptions, ...forestScopeOptions(scope, scope, reach.exclude) } : queryOptions;
    if (await service.get(org, ReadmeNode)) nodes.push(...await service.query(org, options).value());
  }
  return [...new Map(nodes.map((node) => [node.path, node])).values()].flatMap((node) => {
    if (!(node instanceof spec.Model) || path.dirname(node.path) === reach.project) return [];
    return [{
      stem: path.basename(path.dirname(node.path)),
      path: scopeRelativePath(scope, node.path),
      title: node.title,
    }];
  });
}

