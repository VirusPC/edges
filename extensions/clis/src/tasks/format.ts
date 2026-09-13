import type { TaskListItem, TaskRecord, TasksErrorCode } from "./types.js";

export type TasksFailure = {
  status: "failed";
  errorCode: TasksErrorCode;
  reason: string;
};

export type TasksSuccess = {
  status: "success";
  command: string;
  tasks?: TaskListItem[];
  task?: Omit<TaskRecord, "sidecarMarkdown">;
  stem?: string;
  path?: string;
  sidecarPath?: string;
  from?: string;
  to?: string;
  runs?: unknown[];
  run?: unknown;
  messages?: unknown[];
};

export function formatTasksResult(payload: TasksSuccess | TasksFailure): string {
  return `${JSON.stringify(payload)}\n`;
}
