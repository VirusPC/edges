import { scopeDir, type BoardTarget } from "./paths.js";
import {
  access,
  lstat,
  mkdir,
  readdir,
  readFile,
  rename,
  rmdir as fsRmdir,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { parseTaskDoc } from "../../models/tasks/frontmatter.js";
import {
  taskDocFromParsed,
  type TaskDoc,
} from "../../models/tasks/task-doc.js";
import {
  filterTasksByPriority,
  priorityFromMetadata,
  sortTasksByPriority,
} from "../../models/tasks/priority.js";
import {
  assertProjectDualWrite,
  DEFAULT_TASK_PROJECT,
  DEFAULT_TASK_PROJECT_DIR,
  filterTasksByProject,
  isUserProjectSlug,
  projectDirName,
  type TaskProjectId,
} from "../../models/tasks/project.js";
import {
  boardRoot,
  parseTarget,
  sidecarRelPath,
  statusDir,
  taskRelPath,
} from "./paths.js";
import {
  TASK_STATUSES,
  TasksError,
  type TaskListItem,
  type TaskPriority,
  type TaskRecord,
  type TaskStatus,
} from "../../models/tasks/types.js";

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
  rmdir(abs: string): Promise<void>;
};

export async function assertBoardPath(
  target: BoardTarget | undefined,
  abs: string,
): Promise<void> {
  if (target === undefined) return;
  const scope = path.resolve(scopeDir(target));
  const board = path.resolve(boardRoot(target));
  const rel = path.relative(board, path.resolve(abs));
  if (rel === ".." || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) {
    throw new TasksError(
      "VALIDATION_ERROR",
      "path is outside selected task board",
    );
  }
  let cursor = scope;
  for (const part of path
    .relative(scope, path.resolve(abs))
    .split(path.sep)
    .filter(Boolean)) {
    cursor = path.join(cursor, part);
    try {
      if ((await lstat(cursor)).isSymbolicLink())
        throw new TasksError(
          "VALIDATION_ERROR",
          "task board paths must not cross symlinks",
        );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") break;
      throw error;
    }
  }
}

export function createNodeBoardFs(target?: BoardTarget): BoardFs {
  return {
    async readFile(abs: string): Promise<string> {
      await assertBoardPath(target, abs);
      return readFile(abs, "utf8");
    },
    async readdir(abs: string): Promise<string[]> {
      await assertBoardPath(target, abs);
      return readdir(abs);
    },
    async exists(abs: string): Promise<boolean> {
      await assertBoardPath(target, abs);
      try {
        await access(abs);
        return true;
      } catch {
        return false;
      }
    },
  };
}

export function createNodeBoardWriter(target?: BoardTarget): BoardWriter {
  return {
    ...createNodeBoardFs(target),
    async writeFile(abs: string, contents: string): Promise<void> {
      await assertBoardPath(target, abs);
      await writeFile(abs, contents, "utf8");
    },
    async mkdirp(abs: string): Promise<void> {
      await assertBoardPath(target, abs);
      await mkdir(abs, { recursive: true });
    },
    async rename(from: string, to: string): Promise<void> {
      await assertBoardPath(target, from);
      await assertBoardPath(target, to);
      await rename(from, to);
    },
    async unlink(abs: string): Promise<void> {
      await assertBoardPath(target, abs);
      await unlink(abs);
    },
    async rmdir(abs: string): Promise<void> {
      await assertBoardPath(target, abs);
      await fsRmdir(abs);
    },
  };
}

function countSidecarRuns(markdown: string): number {
  const rows = markdown
    .split(/\r?\n/)
    .filter((line) => line.trim().startsWith("|"));
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

export async function listProjectIds(
  repoPath: BoardTarget,
  fs: BoardFs,
): Promise<TaskProjectId[]> {
  const root = boardRoot(repoPath);
  if (!(await fs.exists(root))) {
    return [];
  }
  const names = await fs.readdir(root);
  const ids: TaskProjectId[] = [];
  for (const name of names) {
    if (name.startsWith(".") || name === "AGENTS.md" || name === "README.md") {
      continue;
    }
    if ((TASK_STATUSES as readonly string[]).includes(name)) {
      continue;
    }
    try {
      await fs.readdir(path.join(root, name));
    } catch {
      continue;
    }
    if (name === DEFAULT_TASK_PROJECT_DIR) {
      ids.push(DEFAULT_TASK_PROJECT);
    } else if (isUserProjectSlug(name)) {
      ids.push(name);
    }
  }
  return ids.sort((a, b) => {
    if (a === DEFAULT_TASK_PROJECT) {
      return -1;
    }
    if (b === DEFAULT_TASK_PROJECT) {
      return 1;
    }
    return a.localeCompare(b);
  });
}

export type ListedTask = {
  item: TaskListItem;
  doc: TaskDoc;
};

async function readListItem(
  repoPath: BoardTarget,
  project: TaskProjectId,
  status: TaskStatus,
  stem: string,
  fs: BoardFs,
): Promise<ListedTask> {
  const rel = taskRelPath(project, status, stem, repoPath);
  const sidecarRel = sidecarRelPath(project, status, stem, repoPath);
  const abs = path.join(scopeDir(repoPath), rel);
  const sidecarAbs = path.join(scopeDir(repoPath), sidecarRel);
  const markdown = await fs.readFile(abs);
  const parsed = parseTaskDoc(markdown);
  const doc = taskDocFromParsed(parsed);
  const resolvedProject = assertProjectDualWrite(
    projectDirName(project),
    doc.metadata,
  );
  let runCount = 0;
  if (await fs.exists(sidecarAbs)) {
    runCount = countSidecarRuns(await fs.readFile(sidecarAbs));
  }
  return {
    doc,
    item: {
      stem,
      title: doc.metadata["edges-title"] || doc.name || stem,
      status,
      description: doc.description,
      path: rel,
      sidecarPath: sidecarRel,
      runCount,
      priority: priorityFromMetadata(doc.metadata),
      project: resolvedProject,
    },
  };
}

export type TaskListOpts = {
  status?: TaskStatus;
  priorities?: TaskPriority[];
  projects?: TaskProjectId[];
  sort?: "priority";
};

export async function listTasksWithDocs(
  repoPath: BoardTarget,
  opts: TaskListOpts,
  fs: BoardFs,
): Promise<Array<TaskListItem & { doc: TaskDoc }>> {
  const projects = await listProjectIds(repoPath, fs);
  const statuses = opts.status ? [opts.status] : [...TASK_STATUSES];
  const rows: Array<TaskListItem & { doc: TaskDoc }> = [];
  for (const project of projects) {
    for (const status of statuses) {
      const dir = statusDir(repoPath, project, status);
      if (!(await fs.exists(dir))) {
        continue;
      }
      const names = await fs.readdir(dir);
      for (const name of names) {
        if (
          name.startsWith(".") ||
          name === "AGENTS.md" ||
          name === "README.md"
        )
          continue;
        let directory = false;
        try {
          directory = await fs.exists(path.join(dir, name, "index.md"));
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "ENOTDIR") throw error;
        }
        if (!directory) continue;
        const stem = name;
        if (!stem) {
          continue;
        }
        const listed = await readListItem(repoPath, project, status, stem, fs);
        rows.push({ ...listed.item, doc: listed.doc });
      }
    }
  }
  const priorityFiltered = filterTasksByPriority(rows, opts.priorities ?? []);
  const filtered = filterTasksByProject(priorityFiltered, opts.projects ?? []);
  if (opts.sort === "priority") {
    return sortTasksByPriority(filtered);
  }
  if (opts.sort !== undefined) {
    throw new TasksError(
      "VALIDATION_ERROR",
      `invalid --sort: ${String(opts.sort)} (expected priority)`,
    );
  }
  return filtered;
}

export async function listTasks(
  repoPath: BoardTarget,
  opts: TaskListOpts,
  fs: BoardFs,
): Promise<TaskListItem[]> {
  const rows = await listTasksWithDocs(repoPath, opts, fs);
  return rows.map(({ doc: _doc, ...item }) => item);
}

async function findByStem(
  repoPath: BoardTarget,
  stem: string,
  fs: BoardFs,
): Promise<Array<{ project: TaskProjectId; status: TaskStatus }>> {
  const hits: Array<{ project: TaskProjectId; status: TaskStatus }> = [];
  const projects = await listProjectIds(repoPath, fs);
  for (const project of projects) {
    for (const status of TASK_STATUSES) {
      const abs = path.join(
        scopeDir(repoPath),
        taskRelPath(project, status, stem, repoPath),
      );
      if (await fs.exists(abs)) {
        hits.push({ project, status });
      }
    }
  }
  return hits;
}

async function loadRecord(
  repoPath: BoardTarget,
  project: TaskProjectId,
  status: TaskStatus,
  stem: string,
  fs: BoardFs,
): Promise<TaskRecord> {
  const item = (await readListItem(repoPath, project, status, stem, fs)).item;
  const abs = path.join(scopeDir(repoPath), item.path);
  const sidecarAbs = path.join(scopeDir(repoPath), item.sidecarPath);
  const markdown = await fs.readFile(abs);
  const doc = parseTaskDoc(markdown);
  const sidecarExists = await fs.exists(sidecarAbs);
  const sidecarMarkdown = sidecarExists
    ? await fs.readFile(sidecarAbs)
    : undefined;
  return {
    ...item,
    name: doc.name,
    metadata: doc.metadata,
    body: doc.body,
    sidecarExists,
    sidecarMarkdown,
  };
}

export async function getTask(
  repoPath: BoardTarget,
  target: string,
  fs: BoardFs,
): Promise<TaskRecord> {
  const parsed = parseTarget(target);
  if (parsed.kind === "path") {
    const abs = path.isAbsolute(target)
      ? target
      : path.join(scopeDir(repoPath), target);
    if (path.basename(abs) !== "index.md" || !(await fs.exists(abs))) {
      throw new TasksError("TASK_NOT_FOUND", `task not found: ${target}`);
    }
    const rel = path.relative(
      boardRoot(repoPath),
      path.dirname(path.dirname(abs)),
    );
    const parts = rel.split(path.sep).filter(Boolean);
    if (parts.length !== 2 || !TASK_STATUSES.includes(parts[1] as TaskStatus)) {
      throw new TasksError("TASK_NOT_FOUND", `task not found: ${target}`);
    }
    const project =
      parts[0] === DEFAULT_TASK_PROJECT_DIR ? DEFAULT_TASK_PROJECT : parts[0];
    if (project !== DEFAULT_TASK_PROJECT && !isUserProjectSlug(project)) {
      throw new TasksError("TASK_NOT_FOUND", `task not found: ${target}`);
    }
    return loadRecord(
      repoPath,
      project,
      parts[1] as TaskStatus,
      parsed.stem,
      fs,
    );
  }

  const hits = await findByStem(repoPath, parsed.stem, fs);
  if (hits.length === 0) {
    throw new TasksError("TASK_NOT_FOUND", `task not found: ${target}`);
  }
  if (hits.length > 1) {
    throw new TasksError(
      "AMBIGUOUS_TASK",
      `stem ${parsed.stem} exists in multiple project/status folders`,
    );
  }
  return loadRecord(
    repoPath,
    hits[0]!.project,
    hits[0]!.status,
    parsed.stem,
    fs,
  );
}
