import { leafEntryPath } from "../node/entry-path.js";
import { relativeProjectPath } from "../projects/selection.js";
import path from "node:path";
import { validateTaskDocInput } from "./task-doc.js";
import { nativeTaskPath } from "./realpath.js";
import { ProjectNode } from "../../domain/models/index.js";
import { tasksBoardDirName } from "../../domain/config/edges-materials.js";
import { boardLocationOf } from "./node-query.js";
import { resolveBoard, scopeDir, type BoardTarget } from "./paths.js";
import { NodeService } from "../node/node-service.js";
import { portableScope } from "../scope.js";
import { listRepositoryTasksWithDocs, listTasksWithDocs, type BoardFs, type TaskListOpts } from "./board.js";
import type { ReviewPageInput, ReviewPageItem } from "./review-page.js";
import { TasksError, type TaskListItem } from "../../domain/models/tasks/types.js";
import type { TaskDoc } from "../../domain/models/tasks/task-doc.js";

export const GROUPED_LIST_SCHEMA = "edges.tasks.grouped/v1";

export type TaskSource = { scope: string; purpose: "domain" | "maintenance" };
export function sourceIdentity(source: TaskSource, project: string | undefined, stem?: string): string {
  return JSON.stringify(stem === undefined ? [source.scope, source.purpose, project] : [source.scope, source.purpose, project, stem]);
}

export type GroupedListGroup = {
  source?: TaskSource;
  project?: string;
  id: string;
  title: string;
  description?: string;
};

export type GroupedTaskInput = TaskListItem & { doc?: TaskDoc };

export type GroupedListItem = {
  path?: string;
  source?: TaskSource;
  project?: string;
  id: string;
  stem?: string;
  group: string;
  title?: string;
  status?: string;
  description?: string;
  priority?: string;
  doc?: TaskDoc;
};

export type GroupedList = {
  schema: typeof GROUPED_LIST_SCHEMA;
  groups: GroupedListGroup[];
  items: GroupedListItem[];
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function fallbackGroups(): GroupedListGroup[] {
  return [{ id: sourceIdentity({ scope: ".", purpose: "maintenance" }, undefined), title: "Unassigned", description: "Tasks at the scope material root.", source: { scope: ".", purpose: "maintenance" } }];
}

export function buildGroupedList(tasks: GroupedTaskInput[], groups: GroupedListGroup[]): GroupedList {
  return {
    schema: GROUPED_LIST_SCHEMA,
    groups: groups.length > 0 ? groups : fallbackGroups(),
    items: tasks.map((task) => {
      const item: GroupedListItem = {
        id: task.stem,
        stem: task.stem,
        group: groups.find(group => group.project === task.project)?.id ?? fallbackGroups()[0]!.id,
        title: task.title,
        status: task.status,
        description: task.description,
        priority: task.priority,
      };
      if (task.doc) {
        item.doc = task.doc;
      }
      return item;
    }),
  };
}

export function parseSource(raw: unknown): TaskSource | undefined {
  if (raw === undefined) return undefined;
  if (!isPlainObject(raw) || typeof raw.scope !== "string" || !raw.scope || raw.scope.startsWith("/") || raw.scope.includes("\\") || raw.scope.split("/").includes("..") || /^[a-z]:/i.test(raw.scope) || !["domain", "maintenance"].includes(String(raw.purpose))) {
    throw new TasksError("VALIDATION_ERROR", "source requires a portable scope and domain|maintenance purpose");
  }
  return { scope: raw.scope, purpose: raw.purpose as TaskSource["purpose"] };
}
export function parseSourceProject(raw: unknown): string | undefined {
  if (raw === undefined) return undefined;
  if (typeof raw !== "string" || !raw || raw.startsWith("/") || raw.includes("\\") || raw.split("/").some(part => !part || part === "." || part === "..") || /^[a-z]:/i.test(raw))
    throw new TasksError("VALIDATION_ERROR", "project must be a relative Project path (P or P/projects/Q)");
  return raw;
}

function parseGroup(raw: unknown): GroupedListGroup {
  if (!isPlainObject(raw) || typeof raw.id !== "string" || raw.id.trim() === "") {
    throw new TasksError("VALIDATION_ERROR", "grouped list group id must be a non-empty string");
  }
  if (typeof raw.title !== "string" || raw.title.trim() === "") {
    throw new TasksError("VALIDATION_ERROR", "grouped list group title must be a non-empty string");
  }
  const group: GroupedListGroup = { id: raw.id.trim(), title: raw.title.trim() };
  if (typeof raw.description === "string") {
    group.description = raw.description;
  }
  const source = parseSource(raw.source);
  if (source) { group.source = source; group.project = parseSourceProject(raw.project); }
  return group;
}

function parseItem(raw: unknown): GroupedListItem {
  if (!isPlainObject(raw)) {
    throw new TasksError("VALIDATION_ERROR", "grouped list item must be an object");
  }
  const idRaw = typeof raw.id === "string" ? raw.id.trim() : "";
  const stemRaw = typeof raw.stem === "string" ? raw.stem.trim() : "";
  const identity = idRaw || stemRaw;
  if (!identity) {
    throw new TasksError("VALIDATION_ERROR", "grouped list item must have id or stem");
  }
  if (typeof raw.group !== "string" || raw.group.trim() === "") {
    throw new TasksError("VALIDATION_ERROR", "grouped list item group must be a non-empty string");
  }
  const item: GroupedListItem = { id: identity, stem: stemRaw || identity, group: raw.group.trim() };
  if (typeof raw.title === "string") {
    item.title = raw.title;
  }
  if (typeof raw.status === "string") {
    item.status = raw.status;
  }
  if (typeof raw.description === "string") {
    item.description = raw.description;
  }
  if (typeof raw.priority === "string") {
    item.priority = raw.priority;
  }
  if ("doc" in raw && raw.doc !== undefined) {
    item.doc = validateTaskDocInput(raw.doc, "grouped list doc");
  }
  const source = parseSource(raw.source);
  if (source) {
    if (!stemRaw) throw new TasksError("VALIDATION_ERROR", "source-aware item requires its stored stem");
    item.source = source;
    item.project = parseSourceProject(raw.project);
  }
  return item;
}

export function groupedListToReviewPageInput(grouped: GroupedList): ReviewPageInput {
  const groups = (grouped.groups.length > 0 ? grouped.groups : fallbackGroups()).map((group) => ({
    id: group.id,
    title: group.title,
    description: group.description ?? "",
    ...(group.source ? { source: group.source, project: group.project } : {}),
  }));
  const groupIds = new Set(groups.map((group) => group.id));
  const items: ReviewPageItem[] = grouped.items.map((item) => {
    const stem = (item.stem ?? item.id).trim();
    if (!groupIds.has(item.group)) {
      throw new TasksError("VALIDATION_ERROR", `grouped item ${stem} group not found: ${item.group}`);
    }
    const mapped: ReviewPageItem = {
      stem,
      ...(item.source ? { id: item.id, source: item.source, project: item.project } : {}),
      current: item.group,
      suggested: item.group,
    };
    if (item.title !== undefined) {
      mapped.title = item.title;
    }
    if (item.description !== undefined) {
      mapped.description = item.description;
    }
    if (item.status !== undefined) {
      mapped.status = item.status;
    }
    if (item.priority !== undefined) {
      mapped.priority = item.priority;
    }
    if (item.doc !== undefined) {
      mapped.doc = item.doc;
    }
    return mapped;
  });
  return { groups, items };
}

export function parseGroupedList(raw: unknown): GroupedList {
  if (!isPlainObject(raw)) {
    throw new TasksError("VALIDATION_ERROR", "grouped list must be a JSON object");
  }
  if (raw.schema !== GROUPED_LIST_SCHEMA) {
    throw new TasksError("VALIDATION_ERROR", `grouped list schema must be ${GROUPED_LIST_SCHEMA}`);
  }
  if (!Array.isArray(raw.groups) || !Array.isArray(raw.items)) {
    throw new TasksError("VALIDATION_ERROR", "grouped list must have groups[] and items[]");
  }
  const groups = raw.groups.map(parseGroup);
  const items = raw.items.map(parseItem);
  const seen = new Set<string>();
  for (const item of items) {
    const identity = item.source ? sourceIdentity(item.source,item.project,item.stem) : item.id;
    if (seen.has(identity)) throw new TasksError("VALIDATION_ERROR", `duplicate grouped task identity: ${identity}`);
    seen.add(identity);
    const group = groups.find(group => group.id === item.group);
    if (!group) throw new TasksError("VALIDATION_ERROR", `group not found: ${item.group}`);
    if (item.source && (!group.source || group.source.scope !== item.source.scope || group.source.purpose !== item.source.purpose || group.project !== item.project))
      throw new TasksError("VALIDATION_ERROR", "grouped item ownership must match its group");
    if (item.source) item.id = identity;
  }
  return { schema: GROUPED_LIST_SCHEMA, groups, items };
}

async function ownerGroup(root: string, source: TaskSource, project?: string): Promise<GroupedListGroup> {
  const id = sourceIdentity(source, project);
  if (!project) return { id, source, title: source.purpose === "domain" ? "Scope tasks" : "Unassigned", description: "Tasks directly in the scope material root." };
  const collection = source.purpose === "domain" ? "projects" : path.join(".edges", "projects");
  const file = leafEntryPath(path.join(root, source.scope, collection, project));
  const node = await new NodeService({ managedRoot: root }).get(file, ProjectNode);
  if (!node) throw new TasksError("PROJECT_NOT_FOUND", `Project not found: ${file}`);
  return { id, source, project, title: node.title, description: node.description };
}
export async function listGroupedByProject(repoPath: BoardTarget, opts: TaskListOpts, fs: BoardFs, sourceScope = portableScope(scopeDir(repoPath))): Promise<GroupedList> {
  const tasks = await listTasksWithDocs(repoPath, opts, fs);
  const location = resolveBoard(repoPath);
  const project = location.project ? relativeProjectPath(location.scopeDir, location.project) : undefined;
  const source: TaskSource = { scope: sourceScope, purpose: location.purpose };
  const localSource = { ...source, scope: "." };
  const group = { ...await ownerGroup(location.scopeDir, localSource, project), id: sourceIdentity(source, project), source };
  return { schema: GROUPED_LIST_SCHEMA, groups: [group], items: tasks.map(task => ({
    id: sourceIdentity(source,project,task.stem), stem: task.stem, group: group.id, source, project,
    path: task.path, title: task.title, description: task.description, status: task.status, priority: task.priority, doc: task.doc,
  })) };
}
/** Repository grouping follows real Project ownership and retains empty registered Projects. */
export async function listRepositoryGroupedByProject(root: string, opts: TaskListOpts = {}): Promise<GroupedList> {
  root = nativeTaskPath(root);
  const tasks = await listRepositoryTasksWithDocs(root, opts);
  const groups = new Map<string, GroupedListGroup>();
  const defaultGroup = await ownerGroup(root, { scope: ".", purpose: "maintenance" });
  groups.set(defaultGroup.id, defaultGroup);
  const nodes = await new NodeService({ managedRoot: root }).query(root, { types: ["project"], includeHarness: true }).value();
  for (const node of nodes) {
    if (!(node instanceof ProjectNode)) continue;
    const location = boardLocationOf(path.join(node.directoryPath,tasksBoardDirName()),root);
    if (!location.project) continue;
    const source: TaskSource = { scope: path.relative(root,location.scopeDir).split(path.sep).join("/") || ".", purpose: location.purpose };
    const project = relativeProjectPath(location.scopeDir, location.project);
    const group = await ownerGroup(root,source,project);
    groups.set(group.id,group);
  }
  for (const task of tasks) {
    const id = sourceIdentity(task.source,task.project);
    if (!groups.has(id)) groups.set(id,await ownerGroup(root,task.source,task.project));
  }
  return { schema: GROUPED_LIST_SCHEMA, groups: [...groups.values()], items: tasks.map(task => ({
    id: sourceIdentity(task.source,task.project,task.stem), stem: task.stem,
    group: sourceIdentity(task.source,task.project), source: task.source, project: task.project,
    path: task.path, title: task.title, status: task.status, description: task.description, priority: task.priority, doc: task.doc,
  })) };
}
