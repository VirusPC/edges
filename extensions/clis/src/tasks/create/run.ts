import type { BoardWriter } from "../utils/board.js";
import { succeed, type RunResult } from "../utils/result.js";
import type { TasksParseOk } from "../utils/types.js";
import { createTask } from "../utils/write.js";

export async function runCreate(
  parsed: Extract<TasksParseOk, { kind: "tasks-create" }>,
  io: { repoPath: string; writer: BoardWriter; now: Date },
): Promise<RunResult> {
  const created = await createTask(
    io.repoPath,
    {
      title: parsed.title,
      description: parsed.description,
      body: parsed.body,
      status: parsed.status,
      name: parsed.name,
      assignee: parsed.assignee,
    },
    { fs: io.writer, now: io.now },
  );
  return succeed({ status: "success", command: "create", ...created });
}
