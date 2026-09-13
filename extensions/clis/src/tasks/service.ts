import { getTask, listTasks, type BoardFs } from "./board.js";
import { messagesForRun, parseRunLog, resolveRunId, type TaskRun } from "./runlog.js";
import { TasksError, type TaskListItem, type TaskRecord, type TaskStatus } from "./types.js";

export async function listTasksService(
  repoPath: string,
  opts: { status?: TaskStatus },
  fs: BoardFs,
): Promise<TaskListItem[]> {
  return listTasks(repoPath, opts, fs);
}

export async function getTaskService(repoPath: string, target: string, fs: BoardFs): Promise<TaskRecord> {
  return getTask(repoPath, target, fs);
}

export async function findRun(
  repoPath: string,
  runId: string,
  taskStem: string | undefined,
  fs: BoardFs,
): Promise<{ run: TaskRun; messages: Array<{ seq: number; at?: string; text: string }> }> {
  const resolved = resolveRunId(runId, taskStem);
  const record = await getTask(repoPath, resolved.stem, fs);
  const parsed = parseRunLog(record.sidecarMarkdown ?? "", record.stem);
  if (parsed.runs.length === 0) {
    throw new TasksError("RUN_NOT_FOUND", `run not found: ${resolved.runId}`);
  }
  const run = parsed.runs.find((item) => item.runId === resolved.runId);
  if (!run) {
    throw new TasksError("RUN_NOT_FOUND", `run not found: ${resolved.runId}`);
  }
  return { run, messages: messagesForRun(parsed, resolved.runId) };
}
