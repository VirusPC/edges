import path from "node:path";
import { getTask, listProjectIds, type BoardWriter } from "./board.js";
import { renderNewTaskDoc, replaceBody, setMetadataField, setTopLevelField } from "./frontmatter.js";
import { sidecarRelPath, statusDir, taskRelPath } from "./paths.js";
import { newTaskStem, taskNameSlug } from "./slug.js";
import { parseTaskPriority } from "./priority.js";
import { DEFAULT_TASK_PROJECT, TASK_STATUSES, TasksError, type TaskPriority, type TaskProjectId, type TaskStatus } from "./types.js";

export type { BoardWriter };

export type TasksCreateInput = {
  title: string;
  description?: string;
  body?: string;
  status: TaskStatus;
  name?: string;
  assignee?: string;
  priority?: string;
  project?: TaskProjectId;
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

async function stemTaken(
  repoPath: string,
  project: TaskProjectId,
  status: TaskStatus,
  stem: string,
  fs: BoardWriter,
): Promise<boolean> {
  if (await fs.exists(path.join(repoPath, taskRelPath(project, status, stem)))) {
    return true;
  }
  const projects = await listProjectIds(repoPath, fs);
  for (const p of projects) {
    for (const s of TASK_STATUSES) {
      if (p === project && s === status) {
        continue;
      }
      const abs = path.join(repoPath, taskRelPath(p, s, stem));
      if (await fs.exists(abs)) {
        return true;
      }
    }
  }
  return false;
}

async function uniqueStem(
  repoPath: string,
  project: TaskProjectId,
  status: TaskStatus,
  base: string,
  fs: BoardWriter,
): Promise<string> {
  let stem = base;
  let n = 2;
  while (await stemTaken(repoPath, project, status, stem, fs)) {
    stem = `${base}-${n}`;
    n += 1;
  }
  return stem;
}

export async function createTask(
  repoPath: string,
  input: TasksCreateInput,
  io: { fs: BoardWriter; now: Date },
): Promise<{ stem: string; path: string; sidecarPath: string; priority: TaskPriority }> {
  const project = input.project ?? DEFAULT_TASK_PROJECT;
  const priority = input.priority === undefined ? "none" : parseTaskPriority(input.priority);
  await io.fs.mkdirp(statusDir(repoPath, project, input.status));
  const stem = await uniqueStem(repoPath, project, input.status, newTaskStem(input.title, io.now), io.fs);
  const rel = taskRelPath(project, input.status, stem);
  const sidecarRel = sidecarRelPath(project, input.status, stem);
  const markdown = renderNewTaskDoc({
    name: input.name ?? taskNameSlug(input.title),
    description: input.description ?? input.title,
    title: input.title,
    status: input.status,
    priority,
    assignee: input.assignee,
    updatedAt: io.now.toISOString(),
    body: input.body ?? defaultBody(input.title),
  });
  await io.fs.writeFile(path.join(repoPath, rel), markdown);
  await io.fs.writeFile(path.join(repoPath, sidecarRel), emptyRunLog(stem));
  return { stem, path: rel, sidecarPath: sidecarRel, priority };
}

export async function updateTask(
  repoPath: string,
  target: string,
  patch: { title?: string; description?: string; body?: string; assignee?: string; priority?: string },
  io: { fs: BoardWriter; now: Date },
): Promise<{ stem: string; path: string; priority: TaskPriority }> {
  if (!patch.title && !patch.description && !patch.body && !patch.assignee && patch.priority === undefined) {
    throw new TasksError(
      "VALIDATION_ERROR",
      "update requires at least one of --title, --description, --body, --assignee, --priority",
    );
  }
  const parsedPriority = patch.priority === undefined ? undefined : parseTaskPriority(patch.priority);
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
  if (parsedPriority !== undefined) {
    markdown = setMetadataField(markdown, "edges-task-priority", parsedPriority);
  }
  markdown = setMetadataField(markdown, "edges-updated-at", io.now.toISOString());
  await io.fs.writeFile(path.join(repoPath, record.path), markdown);
  return {
    stem: record.stem,
    path: record.path,
    priority: parsedPriority ?? record.priority,
  };
}
