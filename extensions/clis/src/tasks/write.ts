import path from "node:path";
import type { BoardWriter } from "./board.js";
import { renderNewTaskDoc } from "./frontmatter.js";
import { sidecarRelPath, statusDir, taskRelPath } from "./paths.js";
import { newTaskStem, taskNameSlug } from "./slug.js";
import type { TaskStatus } from "./types.js";

export type { BoardWriter };

export type TasksCreateInput = {
  title: string;
  description?: string;
  body?: string;
  status: TaskStatus;
  name?: string;
  assignee?: string;
};

export function emptyRunLog(stem: string): string {
  return `# Run log: ${stem}

| # | agent | started_at | ended_at | status | error_code |
|---|---|---|---|---|---|

## Notes
`;
}

function defaultBody(title: string): string {
  return `${title}\n\n**Why:**\n\n\n**How to apply:**\n`;
}

async function uniqueStem(repoPath: string, status: TaskStatus, base: string, fs: BoardWriter): Promise<string> {
  let stem = base;
  let n = 2;
  while (await fs.exists(path.join(repoPath, taskRelPath(status, stem)))) {
    stem = `${base}-${n}`;
    n += 1;
  }
  return stem;
}

export async function createTask(
  repoPath: string,
  input: TasksCreateInput,
  io: { fs: BoardWriter; now: Date },
): Promise<{ stem: string; path: string; sidecarPath: string }> {
  await io.fs.mkdirp(statusDir(repoPath, input.status));
  const stem = await uniqueStem(repoPath, input.status, newTaskStem(input.title, io.now), io.fs);
  const rel = taskRelPath(input.status, stem);
  const sidecarRel = sidecarRelPath(input.status, stem);
  const markdown = renderNewTaskDoc({
    name: input.name ?? taskNameSlug(input.title),
    description: input.description ?? input.title,
    title: input.title,
    status: input.status,
    assignee: input.assignee,
    updatedAt: io.now.toISOString(),
    body: input.body ?? defaultBody(input.title),
  });
  await io.fs.writeFile(path.join(repoPath, rel), markdown);
  await io.fs.writeFile(path.join(repoPath, sidecarRel), emptyRunLog(stem));
  return { stem, path: rel, sidecarPath: sidecarRel };
}
