import type { TasksErrorCode } from "../domain/models/tasks/types.js";

export function exitCodeFor(result: { status: string; errorCode?: string }): number {
  if (result.status === "success") {
    return 0;
  }
  return exitCodeForError(result.errorCode ?? "");
}

export function exitCodeForError(errorCode: string): number {
  if (errorCode === "VALIDATION_ERROR") return 2;
  if (errorCode.startsWith("AUTH_")) return 4;
  return 1;
}

export function exitCodeForTasksError(code: TasksErrorCode): number {
  return code === "VALIDATION_ERROR" ? 2 : 1;
}
