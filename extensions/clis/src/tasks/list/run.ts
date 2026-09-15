import type { BoardFs } from "../utils/board.js";
import { succeed, type RunResult } from "../utils/result.js";
import { listTasksService } from "../utils/service.js";
import type { TasksParseOk } from "../utils/types.js";

export async function runList(
  parsed: Extract<TasksParseOk, { kind: "tasks-list" }>,
  io: { repoPath: string; fs: BoardFs },
): Promise<RunResult> {
  const tasks = await listTasksService(io.repoPath, { status: parsed.status }, io.fs);
  return succeed({ status: "success", command: "list", tasks });
}
