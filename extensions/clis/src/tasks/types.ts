export const TASK_STATUSES = [
  "backlog",
  "todo",
  "in_progress",
  "in_review",
  "done",
  "blocked",
  "cancelled",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const RUN_STATUSES = ["pending", "running", "completed", "failed", "cancelled"] as const;

export type RunStatus = (typeof RUN_STATUSES)[number];

export type TasksErrorCode =
  | "VALIDATION_ERROR"
  | "TASK_NOT_FOUND"
  | "RUN_NOT_FOUND"
  | "AMBIGUOUS_TASK"
  | "BOARD_IO_ERROR"
  | "UNKNOWN_ERROR";

export type TaskIdentity = {
  stem: string;
  status: TaskStatus;
  path: string;
  sidecarPath: string;
};

export type TaskListItem = {
  stem: string;
  title: string;
  status: TaskStatus;
  description: string;
  path: string;
  sidecarPath: string;
  runCount: number;
};

export type TasksOutput = "table" | "json";

export type TasksParseOk =
  | { kind: "tasks-list"; status?: TaskStatus }
  | { kind: "tasks-get"; target: string }
  | {
      kind: "tasks-create";
      title: string;
      description?: string;
      body?: string;
      status: TaskStatus;
      name?: string;
      assignee?: string;
    }
  | {
      kind: "tasks-update";
      target: string;
      title?: string;
      description?: string;
      body?: string;
      assignee?: string;
    }
  | { kind: "tasks-status"; target: string; next: TaskStatus }
  | { kind: "tasks-runs"; target: string; output: TasksOutput }
  | { kind: "tasks-run-messages"; runId: string; task?: string; output: TasksOutput };
