import { realpathSync, linkSync, unlinkSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { checkPath, readEntry, validateEntry, saveEntries, type EntryFile } from '../node-files.js';
import { NodeService } from '../node-service.js';
import { TaskNode } from '../../models/task-node.js';
import { setDomainField } from '../../models/fields.js';
import { assertBoardPath } from './board.js';
import { scopeDir, type BoardTarget } from "./paths.js";
import path from "node:path";
import { getTask, listProjectIds, type BoardWriter } from "./board.js";
import { renderNewTaskDoc, taskBody } from "../../models/tasks/frontmatter.js";
import { sidecarRelPath, statusDir, taskRelPath } from "./paths.js";
import { newTaskStem, taskNameSlug } from "../../models/tasks/slug.js";
import { parseTaskPriority } from "../../models/tasks/priority.js";
import { parseTaskProject } from "../../models/tasks/project.js";
import { DEFAULT_TASK_PROJECT, TASK_STATUSES, TasksError, type TaskPriority, type TaskProjectId, type TaskStatus } from "../../models/tasks/types.js";

export type { BoardWriter };

export type TasksCreateInput = {
  title: string;
  format?: "file" | "directory";
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
  if (await fs.exists(path.join(scopeDir(repoPath), taskRelPath(project, status, stem, repoPath))) || await fs.exists(path.join(statusDir(repoPath, project, status), stem))) {
    return true;
  }
  const projects = await listProjectIds(repoPath, fs);
  for (const p of projects) {
    for (const s of TASK_STATUSES) {
      if (p === project && s === status) {
        continue;
      }
      const abs = path.join(scopeDir(repoPath), taskRelPath(p, s, stem, repoPath));
      if (await fs.exists(abs) || await fs.exists(path.join(statusDir(repoPath, p, s), stem))) {
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
  if (input.format !== undefined && input.format !== 'file' && input.format !== 'directory') throw new TasksError('VALIDATION_ERROR', 'Invalid entry format');
  const project = input.project === undefined ? DEFAULT_TASK_PROJECT : parseTaskProject(input.project);
  const priority = input.priority === undefined ? "none" : parseTaskPriority(input.priority);
  await io.fs.mkdirp(statusDir(repoPath, project, input.status));
  const stem = await uniqueStem(repoPath, project, input.status, newTaskStem(input.title, io.now), io.fs);
  const rel = taskRelPath(project, input.status, stem, repoPath, input.format);
  const sidecarRel = sidecarRelPath(project, input.status, stem, repoPath, input.format);
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
  const node = new TaskNode(taskFile(repoPath, rel)).parse(markdown);
  await service.create(node, { metadata: node.metadata, body: node.body });
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
  if (patch.body !== undefined) node.body = node.metadata === undefined ? patch.body : taskBody(patch.body);
  if (patch.assignee !== undefined) node.assignee = patch.assignee;
  if (parsedPriority !== undefined) node.priority = parsedPriority;
  if (parsedProject !== undefined) setDomainField(node, 'edges-task-project', parsedProject);
  setDomainField(node, 'edges-updated-at', io.now.toISOString());

  let destRel = record.path;
  if (parsedProject !== undefined) {
    destRel = taskRelPath(parsedProject, record.status, record.stem, repoPath, node.directoryPath ? 'directory' : 'file');
    const destSidecarRel = sidecarRelPath(parsedProject, record.status, record.stem, repoPath, node.directoryPath ? 'directory' : 'file');
    if (destRel !== record.path) {
      if (await io.fs.exists(path.join(scopeDir(repoPath), destRel))) {
        throw new TasksError("BOARD_IO_ERROR", `destination already exists: ${destRel}`);
      }
      await io.fs.mkdirp(statusDir(repoPath, parsedProject, record.status));
      await moveTaskEntry(repoPath, service, node, destRel, record.sidecarPath, destSidecarRel, io.fs);
    } else {
      await service.update(node, {});
    }
  } else {
    await service.update(node, {});
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
  return new NodeService({ managedRoot: realpathSync(scopeDir(target)), assertWrite: ({ node }) => assertBoardPath(target, path.join(scopeDir(target), path.relative(realpathSync(scopeDir(target)), node.path))) });
}

export function taskFile(target: BoardTarget, relative: string): string {
  return path.join(realpathSync(scopeDir(target)), relative);
}

/** Standalone runlogs remain explicit business companions; directory runlogs are resources. */
export async function moveTaskEntry(target: BoardTarget, service: NodeService, node: TaskNode, destination: string, sourceLog: string, destinationLog: string, fs: BoardWriter): Promise<void> {
  const dest = path.join(scopeDir(target), destinationLog);
  const alternate = node.directoryPath ? path.dirname(destination) + '.md' : path.join(destination.slice(0, -3), 'index.md');
  if (await fs.exists(path.join(scopeDir(target), alternate))) throw new TasksError('BOARD_IO_ERROR', `destination entry already exists: ${alternate}`);
  if (await fs.exists(dest)) throw new TasksError('BOARD_IO_ERROR', `destination runlog already exists: ${destinationLog}`);
  if (node.directoryPath) { await service.move(node, taskFile(target, destination)); return; }
  const before = readEntry(taskFile(target, sourceLog));
  const movedLog = before ? relocateRunlog(before, taskFile(target, destinationLog)) : undefined;
  try { await service.move(node, taskFile(target, destination)); }
  catch (cause) {
    if (movedLog && before) {
      try { relocateRunlog(movedLog, before.path); }
      catch (recoveryCause) {
        const recovery = path.join(path.dirname(movedLog.path), `.node-recovery-${randomUUID()}.log.md`);
        try { saveEntries([{ path: recovery, source: before.source, createMode: before.mode }]); }
        catch { throw new TasksError('BOARD_IO_ERROR', `Task move failed; runlog recovery copy unavailable. Inspect ${before.path} and ${movedLog.path}. ${String(cause)}; ${String(recoveryCause)}`); }
        throw new TasksError('BOARD_IO_ERROR', `Task move failed; recover original runlog from ${recovery}. Preserved current paths ${before.path} and ${movedLog.path}. ${String(cause)}; ${String(recoveryCause)}`);
      }
    }
    throw cause;
  }
}

/** Link is an exclusive destination claim; unlike rename it cannot clobber an
 * intervening writer. Validate both identities/content before removing a name. */
function relocateRunlog(before: EntryFile, destination: string): EntryFile {
  validateEntry(before);
  checkPath(destination);
  linkSync(before.path, destination);
  const after = { ...before, path: destination, realDirectory: realpathSync(path.dirname(destination)), realPath: destination };
  try {
    validateEntry(before); validateEntry(after);
    unlinkSync(before.path);
    return after;
  } catch (cause) {
    throw new TasksError('BOARD_IO_ERROR', `Runlog relocation incomplete; retained recovery paths ${before.path} and ${destination}. ${String(cause)}`);
  }
}
