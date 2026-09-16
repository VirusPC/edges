import path from "node:path";
import { getTask, type BoardWriter } from "./board.js";
import { setMetadataField } from "./frontmatter.js";
import { sidecarRelPath, statusDir, taskRelPath } from "./paths.js";
import { TasksError, type TaskStatus } from "./types.js";

export async function moveTaskStatus(
  repoPath: string,
  target: string,
  next: TaskStatus,
  io: { fs: BoardWriter; now: Date },
): Promise<{ stem: string; from: TaskStatus; to: TaskStatus; path: string; sidecarPath: string }> {
  const record = await getTask(repoPath, target, io.fs);
  const destRel = taskRelPath(record.project, next, record.stem);
  const destSidecarRel = sidecarRelPath(record.project, next, record.stem);
  if (record.status === next) {
    return {
      stem: record.stem,
      from: record.status,
      to: next,
      path: record.path,
      sidecarPath: record.sidecarPath,
    };
  }

  const destAbs = path.join(repoPath, destRel);
  if (await io.fs.exists(destAbs)) {
    throw new TasksError("BOARD_IO_ERROR", `destination already exists: ${destRel}`);
  }

  await io.fs.mkdirp(statusDir(repoPath, record.project, next));
  const sourceAbs = path.join(repoPath, record.path);
  let markdown = await io.fs.readFile(sourceAbs);
  markdown = setMetadataField(markdown, "edges-tasks-status", next);
  markdown = setMetadataField(markdown, "edges-updated-at", io.now.toISOString());
  await io.fs.writeFile(destAbs, markdown);

  const sourceSidecarAbs = path.join(repoPath, record.sidecarPath);
  if (await io.fs.exists(sourceSidecarAbs)) {
    await io.fs.rename(sourceSidecarAbs, path.join(repoPath, destSidecarRel));
  }
  await io.fs.unlink(sourceAbs);

  return {
    stem: record.stem,
    from: record.status,
    to: next,
    path: destRel,
    sidecarPath: destSidecarRel,
  };
}
