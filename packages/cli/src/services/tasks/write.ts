import path from "node:path";
import { NodeService } from "../node/node-service.js";
import { TaskNode } from "../../domain/models/tasks/task-node.js";
import type { BaseNode } from "../../domain/models/index.js";
import { setDomainField } from "../../domain/core/fields.js";
import { assertBoardPath, assertCurrentBoard, createNodeBoardWriter, getTask, nativeTaskPath, type BoardWriter } from "./board.js";
import { scopeDir, resolveBoard, taskBoardLocation, sidecarRelPath, statusDir, taskRelPath, withEntryName, type BoardTarget } from "./paths.js";
import { taskBody } from "../../domain/models/tasks/frontmatter.js";
import { newTaskStem, taskNameSlug } from "../../domain/models/tasks/slug.js";
import { parseTaskPriority } from "../../domain/models/tasks/priority.js";
import { resolveProjectSelection } from "../projects/selection.js";
import { ensureMaterialOrg } from "../node/content-org-list.js";
import { TASK_STATUSES, TasksError, type TaskStatus } from "../../domain/models/tasks/types.js";

export type { BoardWriter };
export type TasksCreateInput = {
  title: string; description?: string; body?: string; status: TaskStatus;
  name?: string; assignee?: string; priority?: string;
};
export function emptyRunLog(stem: string): string {
  return `# Run log: ${stem}\n\n| # | agent | started_at | ended_at | status | error_code |\n|---|---|---|---|---|---|\n\n## Notes\n`;
}
function defaultBody(title: string): string { return `${title}\n\n**Why:**\n\n\n**How to apply:**\n`; }
async function stemTaken(target: BoardTarget, stem: string, fs: BoardWriter): Promise<boolean> {
  for (const status of TASK_STATUSES) {
    if (await fs.exists(path.join(statusDir(target, status), stem))) return true;
  }
  return false;
}
export async function createTask(target: BoardTarget, input: TasksCreateInput, io: { fs: BoardWriter; now: Date }) {
  const priority = input.priority === undefined ? "none" : parseTaskPriority(input.priority);
  await assertCurrentBoard(target, io.fs);
  await ensureTaskDestination(target, input.status, io.fs);
  const base = newTaskStem(input.title, io.now);
  let stem = base, n = 2;
  while (await stemTaken(target, stem, io.fs)) stem = `${base}-${n++}`;
  const rel = taskRelPath(input.status, stem, target);
  const sidecarRel = sidecarRelPath(input.status, stem, target);
  await taskNodes(target).create(new TaskNode(taskFile(target, rel)), {
    name: input.name ?? taskNameSlug(input.title), description: input.description ?? input.title,
    title: input.title, status: input.status, priority, assignee: input.assignee,
    metadata: { metadata: { "edges-type": "task", "edges-updated-at": io.now.toISOString() } },
    body: input.body ?? defaultBody(input.title),
  }, { indexGroup: "local" });
  await io.fs.writeFile(path.join(scopeDir(target), sidecarRel), emptyRunLog(stem));
  return { stem, path: rel, sidecarPath: sidecarRel, priority, project: relativeProject(target) };
}
function relativeProject(target: BoardTarget): string | undefined {
  const location = resolveBoard(target);
  return location.project ? path.relative(path.join(location.scopeDir, ".edges/projects"), location.project).split(path.sep).join("/") : undefined;
}
export async function updateTask(
  target: BoardTarget, task: string,
  patch: { title?: string; description?: string; body?: string; assignee?: string; priority?: string; toProject?: string; toDefault?: boolean; name?: string },
  io: { fs: BoardWriter; now: Date },
) {
  if (patch.toProject !== undefined && patch.toDefault) throw new TasksError("VALIDATION_ERROR", "--to-project and --to-default are mutually exclusive");
  if (!Object.values(patch).some(value => value !== undefined && value !== false))
    throw new TasksError("VALIDATION_ERROR", "update requires a field, --to-project or --to-default");
  if (patch.name !== undefined && !patch.name.trim()) throw new TasksError("VALIDATION_ERROR", "name must be nonempty");
  const priority = patch.priority === undefined ? undefined : parseTaskPriority(patch.priority);
  const record = await getTask(target, task, io.fs);
  const location = resolveBoard(target);
  const destination = patch.toProject !== undefined
    ? taskBoardLocation(location.scopeDir, { project: await resolveProjectSelection(location.scopeDir, patch.toProject) })
    : patch.toDefault ? taskBoardLocation(location.scopeDir) : location;
  const destinationFs = destination.boardDir === location.boardDir ? io.fs : createNodeBoardWriter(destination);
  await assertCurrentBoard(destination, destinationFs);
  const destRel = withEntryName(taskRelPath(record.status, record.stem, destination), record.path);
  if (destRel !== record.path && await stemTaken(destination, record.stem, destinationFs))
    throw new TasksError("BOARD_IO_ERROR", `destination task already exists: ${record.stem}`);
  const service = taskNodes(target, destination);
  const node = await service.get(taskFile(target, record.path), TaskNode);
  if (!node) throw new TasksError("TASK_NOT_FOUND", `task not found: ${task}`);
  if (patch.title !== undefined) node.title = patch.title;
  if (patch.description !== undefined) node.setMetadata("description", patch.description);
  if (patch.body !== undefined) node.body = node.metadata === undefined ? patch.body : taskBody(patch.body);
  if (patch.assignee !== undefined) node.assignee = patch.assignee;
  if (patch.name !== undefined) node.name = patch.name;
  if (priority !== undefined) node.priority = priority;
  setDomainField(node, "edges-updated-at", io.now.toISOString());
  if (destRel !== record.path) {
    await ensureTaskDestination(destination, record.status, destinationFs);
    await moveTaskEntry(destination, service, node, destRel, record.sidecarPath, sidecarRelPath(record.status, record.stem, destination), destinationFs);
  } else await service.update(node, {});
  return { stem: record.stem, path: destRel, priority: priority ?? record.priority, project: relativeProject(destination) };
}

/** NodeService needs the shared scope root to update both board indexes atomically. */
export function taskNodes(target: BoardTarget, destination: BoardTarget = target): NodeService {
  return new TaskNodeService(target, destination);
}
class TaskNodeService extends NodeService {
  constructor(private readonly sourceBoard: BoardTarget, private readonly destinationBoard: BoardTarget) {
    super({
      managedRoot: nativeTaskPath(scopeDir(sourceBoard)),
      assertWrite: async ({ operation, node }) => {
        // A validated move also rewrites incoming links in other registered
        // materials. NodeService retains its scope, symlink and read-only guards.
        if (operation !== "move") await assertBoardPath(sourceBoard, node.path);
      },
    });
  }
  override async move<T extends BaseNode>(node: T, destinationPath: string): Promise<T> {
    if (!(node instanceof TaskNode)) throw new TasksError("VALIDATION_ERROR", "task moves require a Task root");
    await assertBoardPath(this.sourceBoard, node.path);
    await assertBoardPath(this.destinationBoard, destinationPath);
    return super.move(node, destinationPath);
  }
}
export function taskFile(target: BoardTarget, relative: string): string { return path.join(nativeTaskPath(scopeDir(target)), relative); }
export async function ensureTaskDestination(target: BoardTarget, status: TaskStatus, writer: BoardWriter): Promise<void> {
  const location = resolveBoard(target);
  await assertCurrentBoard(target, writer);
  const scope = nativeTaskPath(location.scopeDir);
  await ensureMaterialOrg(new NodeService({ managedRoot: scope }), scope, "tasks", "Tasks", "Task board", {
    super: location.purpose === "domain", project: location.project,
  });
  await writer.mkdirp(statusDir(target, status));
}
/** Run logs and resources travel with the complete task directory. */
export async function moveTaskEntry(target: BoardTarget, service: NodeService, node: TaskNode, destination: string, _sourceLog: string, destinationLog: string, fs: BoardWriter): Promise<void> {
  for (const candidate of [path.dirname(destination), path.dirname(destination) + ".md", destinationLog]) {
    if (await fs.exists(path.join(scopeDir(target), candidate)))
      throw new TasksError("BOARD_IO_ERROR", `destination already exists: ${candidate}`);
  }
  await service.move(node, taskFile(target, destination));
}
