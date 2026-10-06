import {
  DEFAULT_TASK_PROJECT,
  DEFAULT_TASK_PROJECT_DIR,
  TASK_STATUSES,
  TasksError,
  type TaskProjectId,
} from "./types.js";

export { DEFAULT_TASK_PROJECT, DEFAULT_TASK_PROJECT_DIR, type TaskProjectId };

export const TASK_PROJECT_FIELD = "edges-task-project";

const SLUG = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

export function isUserProjectSlug(raw: string): boolean {
  if (raw === DEFAULT_TASK_PROJECT || raw === DEFAULT_TASK_PROJECT_DIR) {
    return false;
  }
  if ((TASK_STATUSES as readonly string[]).includes(raw)) {
    return false;
  }
  return SLUG.test(raw) && raw.length <= 64;
}

export function isTaskProjectId(raw: string): raw is TaskProjectId {
  return raw === DEFAULT_TASK_PROJECT || isUserProjectSlug(raw);
}

export function parseTaskProject(raw: string): TaskProjectId {
  if (!isTaskProjectId(raw)) {
    throw new TasksError(
      "VALIDATION_ERROR",
      `invalid edges-task-project: ${raw} (expected default or lowercase ASCII kebab-case slug)`,
    );
  }
  return raw;
}

export function projectDirName(id: TaskProjectId): string {
  return id === DEFAULT_TASK_PROJECT ? DEFAULT_TASK_PROJECT_DIR : id;
}

export function projectIdFromDir(dirName: string): TaskProjectId {
  if (dirName === DEFAULT_TASK_PROJECT_DIR) {
    return DEFAULT_TASK_PROJECT;
  }
  if (isUserProjectSlug(dirName)) {
    return dirName;
  }
  throw new TasksError("VALIDATION_ERROR", `invalid project directory: ${dirName}`);
}

export function assertProjectDualWrite(
  dirName: string,
  metadata: Record<string, string>,
): TaskProjectId {
  const raw = metadata[TASK_PROJECT_FIELD];
  const fieldId = raw === undefined || raw === "" ? DEFAULT_TASK_PROJECT : raw;
  const dirId = projectIdFromDir(dirName);
  if (fieldId !== dirId) {
    throw new TasksError(
      "VALIDATION_ERROR",
      `edges-task-project dual-write mismatch: dir=${dirName} field=${raw || "(missing)"}`,
    );
  }
  return dirId;
}

export function filterTasksByProject<T extends { project: TaskProjectId }>(
  items: T[],
  allowed: readonly TaskProjectId[],
): T[] {
  if (allowed.length === 0) {
    return items;
  }
  const set = new Set(allowed);
  return items.filter((item) => set.has(item.project));
}
