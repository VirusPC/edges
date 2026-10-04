import { realpathSync } from 'node:fs';
import { NodeService } from '../node-service.js';
import { TaskNode } from '../../models/task-node.js';
import { setDomainField } from '../../models/fields.js';
import { assertBoardPath } from './board.js';
import { scopeDir, type BoardTarget } from "./paths.js";
import path from "node:path";
import { getTask, listProjectIds, type BoardWriter } from "./board.js";
import { renderNewTaskDoc } from "../../models/tasks/frontmatter.js";
import { sidecarRelPath, statusDir, taskRelPath } from "./paths.js";
import { newTaskStem, taskNameSlug } from "../../models/tasks/slug.js";
import { parseTaskPriority } from "../../models/tasks/priority.js";
import { parseTaskProject } from "../../models/tasks/project.js";
import { DEFAULT_TASK_PROJECT, TASK_STATUSES, TasksError, type TaskPriority, type TaskProjectId, type TaskStatus } from "../../models/tasks/types.js";

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
  repoPath: BoardTarget,
  project: TaskProjectId,
  status: TaskStatus,
  stem: string,
  fs: BoardWriter,
): Promise<boolean> {
  if (await fs.exists(path.join(scopeDir(repoPath), taskRelPath(project, status, stem, repoPath)))) {
    return true;
  }
  const projects = await listProjectIds(repoPath, fs);
  for (const p of projects) {
    for (const s of TASK_STATUSES) {
      if (p === project && s === status) {
        continue;
      }
      const abs = path.join(scopeDir(repoPath), taskRelPath(p, s, stem, repoPath));
      if (await fs.exists(abs)) {
        return true;
      }
    }
  }
  return false;
}

async function uniqueStem(
  repoPath: BoardTarget,
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
  repoPath: BoardTarget,
  input: TasksCreateInput,
  io: { fs: BoardWriter; now: Date },
): Promise<{ stem: string; path: string; sidecarPath: string; priority: TaskPriority; project: TaskProjectId }> {
  const project = input.project === undefined ? DEFAULT_TASK_PROJECT : parseTaskProject(input.project);
  const priority = input.priority === undefined ? "none" : parseTaskPriority(input.priority);
  await io.fs.mkdirp(statusDir(repoPath, project, input.status));
  const stem = await uniqueStem(repoPath, project, input.status, newTaskStem(input.title, io.now), io.fs);
  const rel = taskRelPath(project, input.status, stem, repoPath);
  const sidecarRel = sidecarRelPath(project, input.status, stem, repoPath);
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
  const service = taskNodes(repoPath);
  await service.create(new TaskNode(taskFile(repoPath, rel)).parse(markdown));
  await io.fs.writeFile(path.join(scopeDir(repoPath), sidecarRel), emptyRunLog(stem));
  return { stem, path: rel, sidecarPath: sidecarRel, priority, project };
}

export async function updateTask(
  repoPath: BoardTarget,
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
  const service = taskNodes(repoPath);
  const node = await service.get(taskFile(repoPath, record.path), TaskNode);
  if (!node) throw new TasksError("TASK_NOT_FOUND", `task not found: ${target}`);
  if (patch.title !== undefined) node.title = patch.title;
  if (patch.description !== undefined) node.setMetadata('description', patch.description);
  if (patch.body !== undefined) node.body = `\n${patch.body.trimEnd()}\n`;
  if (patch.assignee !== undefined) node.assignee = patch.assignee;
  if (parsedPriority !== undefined) node.priority = parsedPriority;
  if (parsedProject !== undefined) setDomainField(node, 'edges-task-project', parsedProject);
  setDomainField(node, 'edges-updated-at', io.now.toISOString());

  let destRel = record.path;
  if (parsedProject !== undefined) {
    destRel = taskRelPath(parsedProject, record.status, record.stem, repoPath);
    const destSidecarRel = sidecarRelPath(parsedProject, record.status, record.stem, repoPath);
    if (destRel !== record.path) {
      if (await io.fs.exists(path.join(scopeDir(repoPath), destRel))) {
        throw new TasksError("BOARD_IO_ERROR", `destination already exists: ${destRel}`);
      }
      await io.fs.mkdirp(statusDir(repoPath, parsedProject, record.status));
      await service.create(new TaskNode(taskFile(repoPath, destRel)).parse(node.serialize()));
      const sourceSidecarAbs = path.join(scopeDir(repoPath), record.sidecarPath);
      if (await io.fs.exists(sourceSidecarAbs)) {
        await io.fs.rename(sourceSidecarAbs, path.join(scopeDir(repoPath), destSidecarRel));
      }
      await service.destroy(node);
    } else {
      await service.update(node);
    }
  } else {
    await service.update(node);
  }

  return {
    stem: record.stem,
    path: destRel,
    priority: parsedPriority ?? record.priority,
    project: parsedProject ?? record.project,
  };
}

/** Scope and board authorization remain with Tasks, including every NodeService write. */
export function taskNodes(target: BoardTarget): NodeService {
  return new NodeService({ assertWrite: ({ node }) => assertBoardPath(target, path.join(scopeDir(target), path.relative(realpathSync(scopeDir(target)), node.path))) });
}

export function taskFile(target: BoardTarget, relative: string): string {
  return path.join(realpathSync(scopeDir(target)), relative);
}
