import path from "node:path";
import { getTask, type BoardWriter } from "./board.js";
import { renderNewTaskDoc, replaceBody, setMetadataField, setTopLevelField } from "./frontmatter.js";
import { sidecarRelPath, statusDir, taskRelPath } from "./paths.js";
import { newTaskStem, taskNameSlug } from "./slug.js";
import { TasksError, type TaskStatus } from "./types.js";

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

export async function updateTask(
  repoPath: string,
  target: string,
  patch: { title?: string; description?: string; body?: string; assignee?: string },
  io: { fs: BoardWriter; now: Date },
): Promise<{ stem: string; path: string }> {
  if (!patch.title && !patch.description && !patch.body && !patch.assignee) {
    throw new TasksError(
      "VALIDATION_ERROR",
      "update requires at least one of --title, --description, --body, --assignee",
    );
  }
  const record = await getTask(repoPath, target, io.fs);
  let markdown = await io.fs.readFile(path.join(repoPath, record.path));
  if (patch.title !== undefined) {
    markdown = setMetadataField(markdown, "edges-title", patch.title);
  }
  if (patch.description !== undefined) {
    markdown = setTopLevelField(markdown, "description", patch.description);
  }
  if (patch.body !== undefined) {
    markdown = replaceBody(markdown, patch.body);
  }
  if (patch.assignee !== undefined) {
    markdown = setMetadataField(markdown, "edges-task-assignee", patch.assignee);
  }
  markdown = setMetadataField(markdown, "edges-updated-at", io.now.toISOString());
  await io.fs.writeFile(path.join(repoPath, record.path), markdown);
  return { stem: record.stem, path: record.path };
}
