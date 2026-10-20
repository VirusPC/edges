import { TASK_PRIORITIES, TasksError, type TaskPriority } from "./types.js";

export { TASK_PRIORITIES, type TaskPriority };
export const TASK_PRIORITY_FIELD = "edges-task-priority";

const RANK: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
  none: 4,
};

export function isTaskPriority(raw: string): raw is TaskPriority {
  return (TASK_PRIORITIES as readonly string[]).includes(raw);
}

export function parseTaskPriority(raw: string): TaskPriority {
  if (!isTaskPriority(raw)) {
    throw new TasksError(
      "VALIDATION_ERROR",
      `invalid edges-task-priority: ${raw} (expected urgent|high|medium|low|none)`,
    );
  }
  return raw;
}

export function priorityFromMetadata(metadata: Record<string, string>): TaskPriority {
  const raw = metadata[TASK_PRIORITY_FIELD];
  if (raw === undefined || raw === "") {
    return "none";
  }
  return isTaskPriority(raw) ? raw : "none";
}

export function compareTaskPriority(a: TaskPriority, b: TaskPriority): number {
  return RANK[a] - RANK[b];
}
