import type { BoardWriter } from "../utils/board.js";
import { succeed, type RunResult } from "../utils/result.js";
import type { TasksParseOk } from "../utils/types.js";
import { updateTask } from "../utils/write.js";

export async function runUpdate(
  parsed: Extract<TasksParseOk, { kind: "tasks-update" }>,
  io: { repoPath: string; writer: BoardWriter; now: Date },
): Promise<RunResult> {
  const updated = await updateTask(
    io.repoPath,
    parsed.target,
    {
      title: parsed.title,
      description: parsed.description,
      body: parsed.body,
      assignee: parsed.assignee,
    },
    { fs: io.writer, now: io.now },
  );
  return succeed({ status: "success", command: "update", ...updated });
}
