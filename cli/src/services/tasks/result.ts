import { subjectTaskBoard } from "./paths.js";
import { loadConfig } from "../config.js";
import { createNodeBoardFs, createNodeBoardWriter } from "./board.js";
import { TasksError, type TasksErrorCode } from "../../domain/models/tasks/types.js";

export function openTasksRuntime(input: {
  env: NodeJS.ProcessEnv;
  super?: boolean;
}) {
  const location = subjectTaskBoard(loadConfig(input.env).scopeDir, { super: input.super });
  return {
    location,
    fs: createNodeBoardFs(location),
    now: new Date(),
    writer: createNodeBoardWriter(location),
  };
}

export function asTasksError(error: unknown): TasksError {
  if (error instanceof TasksError) {
    return error;
  }
  if (error && typeof error === "object" && "errorCode" in error) {
    const code = (error as { errorCode: TasksErrorCode }).errorCode;
    const message = error instanceof Error ? error.message : String(error);
    return new TasksError(code, message);
  }
  const message = error instanceof Error ? error.message : String(error);
  return new TasksError("UNKNOWN_ERROR", message);
}
