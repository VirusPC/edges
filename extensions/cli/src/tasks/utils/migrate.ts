import path from "node:path";
import type { BoardWriter } from "./board.js";
import { boardRoot } from "./paths.js";
import { DEFAULT_TASK_PROJECT, TASK_STATUSES, TasksError } from "./types.js";
import { projectDirName } from "./project.js";

export async function migrateLegacyBoard(
  repoPath: string,
  fs: BoardWriter,
): Promise<{ moved: number; removedStatusDirs: string[] }> {
  let moved = 0;
  const removedStatusDirs: string[] = [];
  for (const status of TASK_STATUSES) {
    const legacyAbs = path.join(boardRoot(repoPath), status);
    if (!(await fs.exists(legacyAbs))) {
      continue;
    }
    let names: string[];
    try {
      names = await fs.readdir(legacyAbs);
    } catch {
      continue;
    }
    const destDir = path.join(boardRoot(repoPath), projectDirName(DEFAULT_TASK_PROJECT), status);
    for (const name of names) {
      const fromAbs = path.join(legacyAbs, name);
      let isDirectory = false;
      try {
        await fs.readdir(fromAbs);
        isDirectory = true;
      } catch {
        isDirectory = false;
      }
      if (isDirectory) {
        throw new TasksError("BOARD_IO_ERROR", `unexpected subdirectory: knowledge/tasks/${status}/${name}`);
      }
      const destAbs = path.join(destDir, name);
      if (await fs.exists(destAbs)) {
        throw new TasksError(
          "BOARD_IO_ERROR",
          `destination already exists: knowledge/tasks/_default/${status}/${name}`,
        );
      }
      await fs.mkdirp(destDir);
      await fs.rename(fromAbs, destAbs);
      moved += 1;
    }
    await fs.rmdir(legacyAbs);
    removedStatusDirs.push(status);
  }
  return { moved, removedStatusDirs };
}
