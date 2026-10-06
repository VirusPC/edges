import { isWithinPath } from '../../utils/filesystem.js';
import * as fs from "node:fs";
import path from "node:path";
import { BaseNode, InternalNode, TaskNode } from "../../domain/models/index.js";
import { domainFields, scalar } from "../../domain/models/fields.js";
import { decodeBody } from "../../domain/models/internal/parse.js";
import {
  assertProjectDualWrite,
  projectIdFromDir,
} from "../../domain/models/tasks/project.js";
import { TasksError } from "../../domain/models/tasks/types.js";
import { checkPath } from "../node-files.js";

import { NodeService } from "../node-service.js";
import { query } from "../../domain/operations/query.js";
import {
  isTaskStatus,
  taskBoardLocation,
  type TaskBoardLocation,
  type TaskPurpose,
} from "./paths.js";

/** No physical directory enumeration: absent boards are empty, old boards need migration. */
export async function taskBoardQuery(
  target: TaskBoardLocation,
  types: readonly string[] = ["task"],
) {
  if (!fs.existsSync(target.boardDir))
    return query(async function* (): AsyncGenerator<BaseNode> {});
  const root = checkPath(
    path.resolve(
      fs.realpathSync(target.scopeDir),
      path.relative(target.scopeDir, target.boardDir),
    ),
  );
  const entry = path.join(root, "AGENTS.md");
  if (!fs.existsSync(entry))
    throw new TasksError(
      "VALIDATION_ERROR",
      `Task board index missing; migrate this board: ${entry}`,
    );
  const service = new NodeService({
    managedRoot: root,
    modelForReference: (_parent, _reference, entry) => {
      if (!isWithinPath(entry, root))
        throw new TasksError(
          "VALIDATION_ERROR",
          "path is outside selected task board",
        );
      return undefined;
    },
  });
  const board = await service.get(entry, InternalNode);
  if (!board || !decodeBody(board.body).sections.memory.present)
    throw new TasksError(
      "VALIDATION_ERROR",
      `Task board index missing; migrate this board: ${entry}`,
    );
  return service.query(root, { types });
}
export async function listTaskNodes(
  target: TaskBoardLocation,
): Promise<TaskNode[]> {
  return (await taskBoardQuery(target))
    .filter((node): node is TaskNode => node instanceof TaskNode)
    .value();
}
export function repositoryNodeQuery(
  root: string,
  types: readonly string[] = ["task"],
) {
  return new NodeService({ managedRoot: fs.realpathSync(root) }).query(
    fs.realpathSync(root),
    {
      includeDescendants: true,
      includeHarness: true,
      types,
    },
  );
}
export async function listRepositoryTaskNodes(
  root: string,
): Promise<TaskNode[]> {
  return repositoryNodeQuery(root)
    .filter((node): node is TaskNode => node instanceof TaskNode)
    .value();
}
/** Classify a board from physical ownership, never from the reference used to reach it. */
export function boardLocationOf(
  board: string,
  root: string,
): TaskBoardLocation {
  if (path.basename(board) !== "tasks")
    throw new TasksError(
      "VALIDATION_ERROR",
      `Invalid task board layout: ${board}`,
    );
  const relative = path.relative(path.resolve(root), board);
  if (
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  )
    throw new TasksError(
      "VALIDATION_ERROR",
      `Task board is outside selected root: ${board}`,
    );
  const owner = path.dirname(board);
  const purpose: TaskPurpose =
    path.basename(owner) === ".harness" ? "maintenance" : "domain";
  return taskBoardLocation(
    purpose === "maintenance" ? path.dirname(owner) : owner,
    purpose,
  );
}
export function taskLocationOf(node: TaskNode, root: string) {
  const stem = path.basename(node.directoryPath),
    statusDir = path.dirname(node.directoryPath);
  const status = path.basename(statusDir),
    projectDir = path.dirname(statusDir);
  const location = boardLocationOf(
    path.dirname(projectDir),
    path.resolve(root),
  );
  if (!isTaskStatus(status))
    throw new TasksError(
      "VALIDATION_ERROR",
      `Invalid task status directory: ${node.path}`,
    );
  const fields = Object.fromEntries(
    Object.entries(domainFields(node.metadata)).map(([key, value]) => [
      key,
      scalar(value),
    ]),
  );
  const project = assertProjectDualWrite(path.basename(projectDir), fields);
  if (fields["edges-tasks-status"] && fields["edges-tasks-status"] !== status)
    throw new TasksError(
      "VALIDATION_ERROR",
      `edges-tasks-status dual-write mismatch: ${node.path}`,
    );
  return {
    source: {
      scope:
        path
          .relative(path.resolve(root), location.scopeDir)
          .split(path.sep)
          .join("/") || ".",
      purpose: location.purpose,
    },
    project,
    status,
    stem,
  };
}
export function projectLocationOf(node: InternalNode, root: string) {
  const board = path.dirname(node.directoryPath);
  if (path.basename(board) !== "tasks") return undefined;
  const location = boardLocationOf(board, root);
  const project = projectIdFromDir(path.basename(node.directoryPath));
  return {
    location,
    project,
    source: {
      scope:
        path.relative(root, location.scopeDir).split(path.sep).join("/") || ".",
      purpose: location.purpose,
    },
  };
}
