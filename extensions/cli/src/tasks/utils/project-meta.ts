import path from "node:path";
import { listProjectIds, type BoardFs, type BoardWriter } from "./board.js";
import { boardRoot } from "./paths.js";
import { parseTaskProject, projectDirName } from "./project.js";
import {
  DEFAULT_TASK_PROJECT,
  TasksError,
  type TaskProjectId,
  type TaskProjectRecord,
} from "./types.js";

export type { TaskProjectRecord };

export const TASK_PROJECTS_START = "<!-- task-projects:start -->";
export const TASK_PROJECTS_END = "<!-- task-projects:end -->";
export const PROJECT_MEMORY_START = "<!-- project-memory:start -->";
export const PROJECT_MEMORY_END = "<!-- project-memory:end -->";

export const DEFAULT_PROJECT_TITLE = "Default";
export const DEFAULT_PROJECT_DESCRIPTION =
  "Ungrouped tasks that have not been assigned a named Task Project.";

const TITLE_MESSAGE = "invalid Task Project title (expected 1–120 characters, no newlines)";
const DESCRIPTION_MESSAGE = "invalid Task Project description (expected 1–2000 characters)";

export function seedTitleFor(id: TaskProjectId): string {
  return id === DEFAULT_TASK_PROJECT ? DEFAULT_PROJECT_TITLE : id;
}

export function seedDescriptionFor(id: TaskProjectId): string {
  return id === DEFAULT_TASK_PROJECT
    ? DEFAULT_PROJECT_DESCRIPTION
    : `Task Project ${id}.`;
}

export function parseProjectTitle(raw: string): string {
  const title = raw.trim();
  if (title.length < 1 || title.length > 120 || /[\r\n]/.test(title)) {
    throw new TasksError("VALIDATION_ERROR", TITLE_MESSAGE);
  }
  return title;
}

export function parseProjectDescription(raw: string): string {
  const description = raw.trim();
  if (description.length < 1 || description.length > 2000) {
    throw new TasksError("VALIDATION_ERROR", DESCRIPTION_MESSAGE);
  }
  return description;
}

export function parseProjectAgents(markdown: string): {
  title: string;
  description: string;
  pointers?: string;
} {
  if (markdown.startsWith("---")) {
    throw new TasksError(
      "VALIDATION_ERROR",
      "Task Project AGENTS.md must not have YAML frontmatter",
    );
  }
  if (markdown.includes("<!-- project-memory:")) {
    throw new TasksError(
      "VALIDATION_ERROR",
      "Task Project AGENTS.md must not contain project-memory markers",
    );
  }

  const lines = markdown.split("\n");
  const heading = lines[0] ?? "";
  const match = heading.match(/^# (.+)$/);
  if (!match) {
    throw new TasksError("VALIDATION_ERROR", TITLE_MESSAGE);
  }
  const title = parseProjectTitle(match[1]);

  const rest = lines.slice(1);
  const pointerIdx = rest.findIndex((line) => line === "## Pointers");
  const descriptionSource =
    pointerIdx === -1 ? rest.join("\n") : rest.slice(0, pointerIdx).join("\n");
  const description = parseProjectDescription(descriptionSource);

  if (pointerIdx === -1) {
    return { title, description };
  }
  return { title, description, pointers: rest.slice(pointerIdx).join("\n") };
}

export function renderProjectAgents(input: {
  title: string;
  description: string;
  pointers?: string;
}): string {
  let out = `# ${input.title}\n\n${input.description}\n`;
  if (input.pointers !== undefined && input.pointers.length > 0) {
    const block = input.pointers.startsWith("## Pointers")
      ? input.pointers.trimEnd()
      : `## Pointers\n\n${input.pointers.trim()}`;
    out += `\n${block}\n`;
  }
  return out;
}

export function oneLineDescription(description: string): string {
  return description.replace(/\r?\n/g, " ").replace(/[ \t]+/g, " ").trim();
}

function isDefaultProject(record: TaskProjectRecord): boolean {
  return record.dir === "_default" || record.dir === "default" || record.project === "default";
}

function sortProjectRecords(projects: TaskProjectRecord[]): TaskProjectRecord[] {
  return [...projects].sort((a, b) => {
    const aDefault = isDefaultProject(a);
    const bDefault = isDefaultProject(b);
    if (aDefault !== bDefault) {
      return aDefault ? -1 : 1;
    }
    return a.dir.localeCompare(b.dir);
  });
}

function managedMemorySpan(markdown: string): string | null {
  const start = markdown.indexOf(PROJECT_MEMORY_START);
  if (start === -1) {
    return null;
  }
  const end = markdown.indexOf(PROJECT_MEMORY_END, start);
  if (end === -1) {
    return null;
  }
  return markdown.slice(start, end + PROJECT_MEMORY_END.length);
}

export function renderTaskProjectsSection(projects: TaskProjectRecord[]): string {
  const bullets = sortProjectRecords(projects).map(
    (record) =>
      `- [\`${record.dir}\`](${record.dir}/AGENTS.md) — ${oneLineDescription(record.description)}`,
  );
  return [
    TASK_PROJECTS_START,
    "## Task Projects",
    "",
    "CLI-maintained index of Task Project titles and descriptions. Do not hand-edit this section.",
    "",
    ...bullets,
    TASK_PROJECTS_END,
  ].join("\n");
}

export function rewriteRootAgents(existing: string, projects: TaskProjectRecord[]): string {
  const block = renderTaskProjectsSection(projects);
  const start = existing.indexOf(TASK_PROJECTS_START);
  const end = existing.indexOf(TASK_PROJECTS_END);

  if (start !== -1 && (end === -1 || end < start)) {
    throw new TasksError(
      "VALIDATION_ERROR",
      "malformed Task Projects markers in knowledge/tasks/AGENTS.md",
    );
  }

  let next: string;
  if (start !== -1) {
    next = existing.slice(0, start) + block + existing.slice(end + TASK_PROJECTS_END.length);
  } else {
    const memoryEnd = existing.indexOf(PROJECT_MEMORY_END);
    if (memoryEnd !== -1) {
      const lineEnd = existing.indexOf("\n", memoryEnd);
      const insertAt = lineEnd === -1 ? existing.length : lineEnd + 1;
      next = `${existing.slice(0, insertAt)}\n${block}\n${existing.slice(insertAt)}`;
    } else {
      next = `${block}\n`;
    }
  }

  const managedBefore = managedMemorySpan(existing);
  const managedAfter = managedMemorySpan(next);
  if (managedBefore !== null && managedAfter !== null && managedBefore !== managedAfter) {
    throw new TasksError(
      "VALIDATION_ERROR",
      "refusing to write Task Projects section inside project-memory markers",
    );
  }

  return next;
}

export function projectAgentsRelPath(id: TaskProjectId): string {
  return `knowledge/tasks/${projectDirName(id)}/AGENTS.md`;
}

function projectAgentsAbsPath(repoPath: string, id: TaskProjectId): string {
  return path.join(repoPath, projectAgentsRelPath(id));
}

function rootAgentsAbsPath(repoPath: string): string {
  return path.join(boardRoot(repoPath), "AGENTS.md");
}

async function collectProjectIds(repoPath: string, fs: BoardFs): Promise<TaskProjectId[]> {
  const listed = await listProjectIds(repoPath, fs);
  const ids: TaskProjectId[] = [DEFAULT_TASK_PROJECT];
  for (const id of listed) {
    if (id !== DEFAULT_TASK_PROJECT) {
      ids.push(id);
    }
  }
  return ids;
}

export async function readProjectRecord(
  repoPath: string,
  id: TaskProjectId,
  fs: BoardFs,
): Promise<TaskProjectRecord> {
  const rel = projectAgentsRelPath(id);
  const abs = projectAgentsAbsPath(repoPath, id);
  if (!(await fs.exists(abs))) {
    throw new TasksError("PROJECT_NOT_FOUND", `project not found: ${id}`);
  }
  const parsed = parseProjectAgents(await fs.readFile(abs));
  return {
    project: id,
    dir: projectDirName(id),
    title: parsed.title,
    description: parsed.description,
    path: rel,
  };
}

export async function refreshProjectIndex(
  repoPath: string,
  writer: BoardWriter,
): Promise<TaskProjectRecord[]> {
  const records: TaskProjectRecord[] = [];
  for (const id of await collectProjectIds(repoPath, writer)) {
    const abs = projectAgentsAbsPath(repoPath, id);
    if (!(await writer.exists(abs))) {
      continue;
    }
    records.push(await readProjectRecord(repoPath, id, writer));
  }

  const rootAbs = rootAgentsAbsPath(repoPath);
  const existing = (await writer.exists(rootAbs)) ? await writer.readFile(rootAbs) : "";
  await writer.writeFile(rootAbs, rewriteRootAgents(existing, records));
  return records;
}

export async function ensureProjectMetadata(
  repoPath: string,
  writer: BoardWriter,
  skipId?: TaskProjectId,
): Promise<TaskProjectRecord[]> {
  await writer.mkdirp(path.join(boardRoot(repoPath), projectDirName(DEFAULT_TASK_PROJECT)));

  for (const id of await collectProjectIds(repoPath, writer)) {
    await writer.mkdirp(path.join(boardRoot(repoPath), projectDirName(id)));
    if (skipId === id) {
      continue;
    }
    const abs = projectAgentsAbsPath(repoPath, id);
    if (!(await writer.exists(abs))) {
      await writer.writeFile(
        abs,
        renderProjectAgents({
          title: seedTitleFor(id),
          description: seedDescriptionFor(id),
        }),
      );
    } else {
      await readProjectRecord(repoPath, id, writer);
    }
  }

  return refreshProjectIndex(repoPath, writer);
}

export async function listProjects(
  repoPath: string,
  writer: BoardWriter,
): Promise<TaskProjectRecord[]> {
  return ensureProjectMetadata(repoPath, writer);
}

export async function getProject(
  repoPath: string,
  raw: string,
  writer: BoardWriter,
): Promise<TaskProjectRecord> {
  const id = parseTaskProject(raw);
  await ensureProjectMetadata(repoPath, writer);
  return readProjectRecord(repoPath, id, writer);
}

export async function createProject(
  repoPath: string,
  input: { project: string; title: string; description: string },
  writer: BoardWriter,
): Promise<TaskProjectRecord> {
  const id = parseTaskProject(input.project);
  const title = parseProjectTitle(input.title);
  const description = parseProjectDescription(input.description);
  await ensureProjectMetadata(repoPath, writer, id);
  const rel = projectAgentsRelPath(id);
  if (await writer.exists(path.join(repoPath, rel))) {
    throw new TasksError("VALIDATION_ERROR", `project already exists: ${id}`);
  }
  await writer.mkdirp(path.join(repoPath, "knowledge/tasks", projectDirName(id)));
  await writer.writeFile(path.join(repoPath, rel), renderProjectAgents({ title, description }));
  await refreshProjectIndex(repoPath, writer);
  return {
    project: id,
    dir: projectDirName(id),
    title,
    description,
    path: rel,
  };
}

export async function updateProject(
  repoPath: string,
  raw: string,
  patch: { title?: string; description?: string },
  writer: BoardWriter,
): Promise<TaskProjectRecord> {
  if (patch.title === undefined && patch.description === undefined) {
    throw new TasksError(
      "VALIDATION_ERROR",
      "project update requires at least one of --title, --description",
    );
  }
  const id = parseTaskProject(raw);
  await ensureProjectMetadata(repoPath, writer);
  const rel = projectAgentsRelPath(id);
  const abs = path.join(repoPath, rel);
  if (!(await writer.exists(abs))) {
    throw new TasksError("PROJECT_NOT_FOUND", `project not found: ${id}`);
  }
  const parsed = parseProjectAgents(await writer.readFile(abs));
  const title = patch.title === undefined ? parsed.title : parseProjectTitle(patch.title);
  const description =
    patch.description === undefined
      ? parsed.description
      : parseProjectDescription(patch.description);
  await writer.writeFile(
    abs,
    renderProjectAgents({ title, description, pointers: parsed.pointers }),
  );
  await refreshProjectIndex(repoPath, writer);
  return {
    project: id,
    dir: projectDirName(id),
    title,
    description,
    path: rel,
  };
}
