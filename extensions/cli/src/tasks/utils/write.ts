import path from "node:path";
import { getTask, listProjectIds, type BoardWriter } from "./board.js";
import { renderNewTaskDoc, replaceBody, setMetadataField, setTopLevelField } from "./frontmatter.js";
import { sidecarRelPath, statusDir, taskRelPath } from "./paths.js";
import { newTaskStem, taskNameSlug } from "./slug.js";
import { parseTaskPriority } from "./priority.js";
import { parseTaskProject } from "./project.js";
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
  project?: string;
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
): Promise<{ stem: string; path: string; sidecarPath: string; priority: TaskPriority; project: TaskProjectId }> {
  const project = input.project === undefined ? DEFAULT_TASK_PROJECT : parseTaskProject(input.project);
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
    project,
    priority,
    assignee: input.assignee,
    updatedAt: io.now.toISOString(),
    body: input.body ?? defaultBody(input.title),
  });
  await io.fs.writeFile(path.join(repoPath, rel), markdown);
  await io.fs.writeFile(path.join(repoPath, sidecarRel), emptyRunLog(stem));
  return { stem, path: rel, sidecarPath: sidecarRel, priority, project };
}

export async function updateTask(
  repoPath: string,
  target: string,
  patch: {
    title?: string;
    description?: string;
    body?: string;
    assignee?: string;
    priority?: string;
    project?: string;
  },
  io: { fs: BoardWriter; now: Date },
): Promise<{ stem: string; path: string; priority: TaskPriority; project: TaskProjectId }> {
  if (
    !patch.title &&
    !patch.description &&
    !patch.body &&
    !patch.assignee &&
    patch.priority === undefined &&
    patch.project === undefined
  ) {
    throw new TasksError(
      "VALIDATION_ERROR",
      "update requires at least one of --title, --description, --body, --assignee, --priority, --project",
    );
  }
  const parsedPriority = patch.priority === undefined ? undefined : parseTaskPriority(patch.priority);
  const parsedProject = patch.project === undefined ? undefined : parseTaskProject(patch.project);
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
  if (parsedProject !== undefined) {
    markdown = setMetadataField(markdown, "edges-task-project", parsedProject);
  }
  markdown = setMetadataField(markdown, "edges-updated-at", io.now.toISOString());

  let destRel = record.path;
  if (parsedProject !== undefined) {
    destRel = taskRelPath(parsedProject, record.status, record.stem);
    const destSidecarRel = sidecarRelPath(parsedProject, record.status, record.stem);
    if (destRel !== record.path) {
      if (await io.fs.exists(path.join(repoPath, destRel))) {
        throw new TasksError("BOARD_IO_ERROR", `destination already exists: ${destRel}`);
      }
      await io.fs.mkdirp(statusDir(repoPath, parsedProject, record.status));
      await io.fs.writeFile(path.join(repoPath, destRel), markdown);
      const sourceSidecarAbs = path.join(repoPath, record.sidecarPath);
      if (await io.fs.exists(sourceSidecarAbs)) {
        await io.fs.rename(sourceSidecarAbs, path.join(repoPath, destSidecarRel));
      }
      await io.fs.unlink(path.join(repoPath, record.path));
    } else {
      await io.fs.writeFile(path.join(repoPath, record.path), markdown);
    }
  } else {
    await io.fs.writeFile(path.join(repoPath, record.path), markdown);
  }

  return {
    stem: record.stem,
    path: destRel,
    priority: parsedPriority ?? record.priority,
    project: parsedProject ?? record.project,
  };
}
