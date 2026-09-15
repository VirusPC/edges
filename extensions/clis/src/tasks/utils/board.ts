import { access, mkdir, readdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseTaskDoc } from "./frontmatter.js";
import { priorityFromMetadata } from "./priority.js";
import {
  boardRoot,
  isTaskMarkdownName,
  parseTarget,
  sidecarRelPath,
  statusDir,
  stemFromFilename,
  taskRelPath,
} from "./paths.js";
import {
  TASK_STATUSES,
  TasksError,
  type TaskListItem,
  type TaskRecord,
  type TaskStatus,
} from "./types.js";

export type BoardFs = {
  readFile(abs: string): Promise<string>;
  readdir(abs: string): Promise<string[]>;
  exists(abs: string): Promise<boolean>;
};

export type BoardWriter = BoardFs & {
  writeFile(abs: string, contents: string): Promise<void>;
  mkdirp(abs: string): Promise<void>;
  rename(from: string, to: string): Promise<void>;
  unlink(abs: string): Promise<void>;
};

export function createNodeBoardFs(): BoardFs {
  return {
    async readFile(abs: string): Promise<string> {
      return readFile(abs, "utf8");
    },
    async readdir(abs: string): Promise<string[]> {
      return readdir(abs);
    },
    async exists(abs: string): Promise<boolean> {
      try {
        await access(abs);
        return true;
      } catch {
        return false;
      }
    },
  };
}

export function createNodeBoardWriter(): BoardWriter {
  return {
    ...createNodeBoardFs(),
    async writeFile(abs: string, contents: string): Promise<void> {
      await writeFile(abs, contents, "utf8");
    },
    async mkdirp(abs: string): Promise<void> {
      await mkdir(abs, { recursive: true });
    },
    async rename(from: string, to: string): Promise<void> {
      await rename(from, to);
    },
    async unlink(abs: string): Promise<void> {
      await unlink(abs);
    },
  };
}

function countSidecarRuns(markdown: string): number {
  const rows = markdown.split(/\r?\n/).filter((line) => line.trim().startsWith("|"));
  let seenHeader = false;
  let count = 0;
  for (const row of rows) {
    const trimmed = row.trim();
    if (trimmed.includes("---") || /^\|[\s|:.-]+\|$/.test(trimmed)) {
      continue;
    }
    if (!seenHeader) {
      seenHeader = true;
      continue;
    }
    count += 1;
  }
  return count;
}

async function listStatusDir(
  repoPath: string,
  status: TaskStatus,
  fs: BoardFs,
): Promise<TaskListItem[]> {
  const dir = statusDir(repoPath, status);
  if (!(await fs.exists(dir))) {
    return [];
  }
  const names = await fs.readdir(dir);
  const items: TaskListItem[] = [];
  for (const name of names) {
    if (!isTaskMarkdownName(name)) {
      continue;
    }
    const stem = stemFromFilename(name);
    if (!stem) {
      continue;
    }
    items.push(await readListItem(repoPath, status, stem, fs));
  }
  return items;
}

async function readListItem(
  repoPath: string,
  status: TaskStatus,
  stem: string,
  fs: BoardFs,
): Promise<TaskListItem> {
  const rel = taskRelPath(status, stem);
  const sidecarRel = sidecarRelPath(status, stem);
  const abs = path.join(repoPath, rel);
  const sidecarAbs = path.join(repoPath, sidecarRel);
  const markdown = await fs.readFile(abs);
  const doc = parseTaskDoc(markdown);
  let runCount = 0;
  if (await fs.exists(sidecarAbs)) {
    runCount = countSidecarRuns(await fs.readFile(sidecarAbs));
  }
  return {
    stem,
    title: doc.metadata["edges-title"] || doc.name || stem,
    status,
    description: doc.description,
    path: rel,
    sidecarPath: sidecarRel,
    runCount,
    priority: priorityFromMetadata(doc.metadata),
  };
}

export async function listTasks(
  repoPath: string,
  opts: { status?: TaskStatus },
  fs: BoardFs,
): Promise<TaskListItem[]> {
  const statuses = opts.status ? [opts.status] : [...TASK_STATUSES];
  const items: TaskListItem[] = [];
  for (const status of statuses) {
    items.push(...(await listStatusDir(repoPath, status, fs)));
  }
  return items;
}

async function findByStem(repoPath: string, stem: string, fs: BoardFs): Promise<Array<{ status: TaskStatus }>> {
  const hits: Array<{ status: TaskStatus }> = [];
  for (const status of TASK_STATUSES) {
    const abs = path.join(repoPath, taskRelPath(status, stem));
    if (await fs.exists(abs)) {
      hits.push({ status });
    }
  }
  return hits;
}

async function loadRecord(
  repoPath: string,
  status: TaskStatus,
  stem: string,
  fs: BoardFs,
): Promise<TaskRecord> {
  const item = await readListItem(repoPath, status, stem, fs);
  const abs = path.join(repoPath, item.path);
  const sidecarAbs = path.join(repoPath, item.sidecarPath);
  const markdown = await fs.readFile(abs);
  const doc = parseTaskDoc(markdown);
  const sidecarExists = await fs.exists(sidecarAbs);
  const sidecarMarkdown = sidecarExists ? await fs.readFile(sidecarAbs) : undefined;
  return {
    ...item,
    name: doc.name,
    metadata: doc.metadata,
    body: doc.body,
    sidecarExists,
    sidecarMarkdown,
  };
}

export async function getTask(repoPath: string, target: string, fs: BoardFs): Promise<TaskRecord> {
  const parsed = parseTarget(target);
  if (parsed.kind === "path") {
    const abs = path.isAbsolute(target) ? target : path.join(repoPath, target);
    if (!(await fs.exists(abs))) {
      throw new TasksError("TASK_NOT_FOUND", `task not found: ${target}`);
    }
    const rel = path.relative(boardRoot(repoPath), path.dirname(abs));
    const status = rel.split(path.sep)[0];
    if (!status || !TASK_STATUSES.includes(status as TaskStatus)) {
      throw new TasksError("TASK_NOT_FOUND", `task not found: ${target}`);
    }
    return loadRecord(repoPath, status as TaskStatus, parsed.stem, fs);
  }

  const hits = await findByStem(repoPath, parsed.stem, fs);
  if (hits.length === 0) {
    throw new TasksError("TASK_NOT_FOUND", `task not found: ${target}`);
  }
  if (hits.length > 1) {
    throw new TasksError(
      "AMBIGUOUS_TASK",
      `stem ${parsed.stem} exists in multiple status folders`,
    );
  }
  return loadRecord(repoPath, hits[0]!.status, parsed.stem, fs);
}
