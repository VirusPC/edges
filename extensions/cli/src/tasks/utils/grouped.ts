import { listProjectIds, listTasksWithDocs, type BoardFs, type TaskListOpts } from "./board.js";
import {
  DEFAULT_PROJECT_DESCRIPTION,
  DEFAULT_PROJECT_TITLE,
  readProjectRecord,
  seedDescriptionFor,
  seedTitleFor,
} from "./project-meta.js";
import type { ReviewPageInput, ReviewPageItem } from "./review-page.js";
import { DEFAULT_TASK_PROJECT, TasksError, type TaskListItem, type TaskProjectId } from "./types.js";
import type { TaskDoc } from "./task-doc.js";

export const GROUPED_LIST_SCHEMA = "edges.tasks.grouped/v1";

export type GroupedListGroup = {
  id: string;
  title: string;
  description?: string;
};

export type GroupedTaskInput = TaskListItem & { doc?: TaskDoc };

export type GroupedListItem = {
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
  return [{ id: DEFAULT_TASK_PROJECT, title: DEFAULT_PROJECT_TITLE, description: DEFAULT_PROJECT_DESCRIPTION }];
}

function sortGroupIds(ids: Iterable<string>): string[] {
  return [...new Set(ids)].sort((a, b) => {
    if (a === DEFAULT_TASK_PROJECT) {
      return -1;
    }
    if (b === DEFAULT_TASK_PROJECT) {
      return 1;
    }
    return a.localeCompare(b);
  });
}

export function buildGroupedList(tasks: GroupedTaskInput[], groups: GroupedListGroup[]): GroupedList {
  return {
    schema: GROUPED_LIST_SCHEMA,
    groups: groups.length > 0 ? groups : fallbackGroups(),
    items: tasks.map((task) => {
      const item: GroupedListItem = {
        id: task.stem,
        stem: task.stem,
        group: task.project,
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
    item.doc = parseTaskDocField(raw.doc);
  }
  return item;
}

function parseTaskDocField(raw: unknown): TaskDoc {
  if (!isPlainObject(raw)) {
    throw new TasksError("VALIDATION_ERROR", "grouped list doc must be an object");
  }
  if (typeof raw.name !== "string" || typeof raw.description !== "string" || typeof raw.body !== "string") {
    throw new TasksError("VALIDATION_ERROR", "grouped list doc requires name, description, and body strings");
  }
  if (!isPlainObject(raw.metadata)) {
    throw new TasksError("VALIDATION_ERROR", "grouped list doc.metadata must be an object");
  }
  const metadata: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw.metadata)) {
    if (typeof value !== "string") {
      throw new TasksError("VALIDATION_ERROR", `grouped list doc.metadata.${key} must be a string`);
    }
    metadata[key] = value;
  }
  return { name: raw.name, description: raw.description, metadata, body: raw.body };
}

export function groupedListToReviewPageInput(grouped: GroupedList): ReviewPageInput {
  const groups = (grouped.groups.length > 0 ? grouped.groups : fallbackGroups()).map((group) => ({
    id: group.id,
    title: group.title,
    description: group.description ?? "",
  }));
  const groupIds = new Set(groups.map((group) => group.id));
  const items: ReviewPageItem[] = grouped.items.map((item) => {
    const stem = (item.stem ?? item.id).trim();
    if (!groupIds.has(item.group)) {
      throw new TasksError("VALIDATION_ERROR", `grouped item ${stem} group not found: ${item.group}`);
    }
    const mapped: ReviewPageItem = {
      stem,
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
  return {
    schema: GROUPED_LIST_SCHEMA,
    groups: raw.groups.map(parseGroup),
    items: raw.items.map(parseItem),
  };
}

async function resolveGroup(
  repoPath: string,
  id: TaskProjectId,
  fs: BoardFs,
): Promise<GroupedListGroup> {
  try {
    const record = await readProjectRecord(repoPath, id, fs);
    return { id: record.project, title: record.title, description: record.description };
  } catch (error) {
    if (error instanceof TasksError && error.errorCode === "PROJECT_NOT_FOUND") {
      return { id, title: seedTitleFor(id), description: seedDescriptionFor(id) };
    }
    throw error;
  }
}

export async function listGroupedByProject(
  repoPath: string,
  opts: TaskListOpts,
  fs: BoardFs,
): Promise<GroupedList> {
  const tasks = await listTasksWithDocs(repoPath, opts, fs);
  const requested = opts.projects ?? [];
  const ids =
    requested.length > 0
      ? requested
      : [...(await listProjectIds(repoPath, fs)), ...tasks.map((task) => task.project)];
  const groups: GroupedListGroup[] = [];
  for (const id of sortGroupIds(ids)) {
    groups.push(await resolveGroup(repoPath, id, fs));
  }
  return buildGroupedList(tasks, groups);
}
