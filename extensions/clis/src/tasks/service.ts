import { getTask, listTasks, type BoardFs } from "./board.js";
import type { TaskListItem, TaskRecord, TaskStatus } from "./types.js";

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
