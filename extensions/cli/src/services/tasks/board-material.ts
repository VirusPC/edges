import { existsSync } from "node:fs";
import path from "node:path";
import {
  harnessMaterialById,
  placeHarnessMaterial,
  tasksBoardDirName,
} from "../../domain/config/harness-materials.js";

export { tasksBoardDirName };

/** Absolute path of the real-system tasks board README. */
export function tasksBoardReadmePath(scopeDir: string): string {
  return placeHarnessMaterial(path.resolve(scopeDir), "tasks").absPath;
}

export function tasksBoardReadmeExists(scopeDir: string): boolean {
  return existsSync(tasksBoardReadmePath(scopeDir));
}

/**
 * The board list itself, not a project README under that directory.
 * Matches the list filter: parent directory name is the board, file name is the material file.
 */
export function isTasksBoardReadmeNode(nodePath: string): boolean {
  const board = tasksBoardDirName();
  const materialName = path.basename(harnessMaterialById("tasks").path);
  return path.basename(path.dirname(nodePath)) === board && path.basename(nodePath) === materialName;
}
