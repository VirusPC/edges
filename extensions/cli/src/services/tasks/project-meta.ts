import { InternalNode } from "../../domain/models/internal-node.js";
import { decodeBody } from '../../domain/models/internal/parse.js';
import { LOCAL_START, LOCAL_END, blockPattern, insertInnerBlock } from '../../domain/models/internal/blocks.js';
import { scopeDir, boardRel, type BoardTarget } from "./paths.js";
import path from "node:path";
import { realpathSync } from "node:fs";
import { readEntry, saveEntries, type FileChange } from "../node-files.js";
import { listProjectIds, type BoardFs, type BoardWriter } from "./board.js";
import { boardRoot } from "./paths.js";
import { parseTaskProject, projectDirName } from "../../domain/models/tasks/project.js";
import {
  DEFAULT_TASK_PROJECT,
  TasksError,
  type TaskProjectId,
  type TaskProjectRecord,
} from "../../domain/models/tasks/types.js";

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
  tail?: string;
} {
  if (markdown.startsWith("---")) {
    throw new TasksError(
      "VALIDATION_ERROR",
      "Task Project AGENTS.md must not have YAML frontmatter",
    );
  }

  const lines = markdown.split("\n");
  const heading = lines[0] ?? "";
  const match = heading.match(/^# (.+)$/);
  if (!match) {
    throw new TasksError("VALIDATION_ERROR", TITLE_MESSAGE);
  }
  const title = parseProjectTitle(match[1]);

  const body = markdown.slice(heading.length + 1);
  const boundary = body.search(/^(?:## |<!-- (?:project-memory|task-projects)(?::|-))/m);
  const descriptionSource = boundary === -1 ? body : body.slice(0, boundary);
  const description = parseProjectDescription(descriptionSource);
  if (boundary === -1) return { title, description };
  const tail = body.slice(descriptionSource.trimEnd().length);
  return { title, description, pointers: body.slice(boundary).startsWith('## Pointers') ? body.slice(boundary) : undefined, tail };

}

export function renderProjectAgents(input: {
  title: string;
  description: string;
  pointers?: string;
  tail?: string;
}): string {
  if (input.tail !== undefined) return `# ${input.title}\n\n${input.description}${input.tail}`;
  let out = `# ${input.title}\n\n${input.description}\n`;
  if (input.pointers !== undefined && input.pointers.length > 0) {
    const block = input.pointers.startsWith("## Pointers")
      ? input.pointers.trimEnd()
      : `## Pointers\n\n${input.pointers.trim()}`;
    out += `\n${block}\n`;
  }
  return out + `\n<!-- project-memory:start -->\n<!-- project-memory-important:start -->\n## 本层硬约束\n\n<!-- project-memory-important:end -->\n<!-- project-memory-local:start -->\n## 本层记忆\n\n<!-- project-memory-local:end -->\n<!-- project-memory-children:start -->\n## 下层记忆索引\n\n<!-- project-memory-children:end -->\n<!-- project-memory:end -->\n`;
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

export function renderTaskProjectsSection(projects: TaskProjectRecord[]): string {
  const bullets = sortProjectRecords(projects).map(
    (record) =>
      `- [\`${record.dir}\`](${record.dir}/AGENTS.md) — ${oneLineDescription(record.description)}`,
  );
  return [
    TASK_PROJECTS_START,
    "",
    "CLI-maintained index of Task Project titles and descriptions. Do not hand-edit this section.",
    "",
    ...bullets,
    TASK_PROJECTS_END,
  ].join("\n");
}

export function rewriteRootAgents(existing: string, projects: TaskProjectRecord[], entryPath = path.resolve("tasks/AGENTS.md")): string {
  const block = renderTaskProjectsSection(projects);
  // Existing ordinary project links are adopted into the owned index, not duplicated.
  if (!existing.includes(TASK_PROJECTS_START)) {
    const node = new InternalNode(entryPath).parse(existing);
    for (const project of projects) {
      const id = path.resolve(path.dirname(entryPath), project.dir, 'AGENTS.md');
      if (node.children.some(ref => ref.id === id)) node.removeChild(id);
    }
    existing = node.serialize();
  }
  const start = existing.indexOf(TASK_PROJECTS_START);
  const end = existing.indexOf(TASK_PROJECTS_END);

  if (start !== -1 && (end === -1 || end < start)) {
    throw new TasksError(
      "VALIDATION_ERROR",
      "malformed Task Projects markers in tasks/AGENTS.md",
    );
  }

  const memorySection = decodeBody(existing).sections.memory;
  const currentLocal = existing.match(blockPattern(LOCAL_START, LOCAL_END));
  if (start !== -1 && ((currentLocal?.index !== undefined && start > currentLocal.index && end < currentLocal.index + currentLocal[0].length) || (memorySection.present && end < memorySection.insert && /^## 本层记忆$/m.test(existing.slice(0, start)))))
    return existing.slice(0, start) + block + existing.slice(end + TASK_PROJECTS_END.length);
  // Move only our owned index span; surrounding business prose stays byte-for-byte.
  if (start !== -1) existing = existing.slice(0, start) + existing.slice(end + TASK_PROJECTS_END.length);
  const local = existing.match(blockPattern(LOCAL_START, LOCAL_END))?.[0];
  if (local) {
    const updated = local.replace(LOCAL_END, () => `${block}\n${LOCAL_END}`);
    return existing.replace(blockPattern(LOCAL_START, LOCAL_END), () => updated);
  }
  const section = decodeBody(existing).sections.memory;
  if (section.present) return existing.slice(0, section.insert) + `${block}\n\n` + existing.slice(section.insert);
  return insertInnerBlock(existing, LOCAL_START, `${LOCAL_START}\n## 本层记忆\n\n${block}\n${LOCAL_END}`);
}

export function projectAgentsRelPath(id: TaskProjectId, target: BoardTarget = ""): string {
  return `${boardRel(target)}/${projectDirName(id)}/AGENTS.md`;
}

function projectAgentsAbsPath(repoPath: BoardTarget, id: TaskProjectId): string {
  return path.join(scopeDir(repoPath), projectAgentsRelPath(id, repoPath));
}

function rootAgentsAbsPath(repoPath: BoardTarget): string {
  return path.join(boardRoot(repoPath), "AGENTS.md");
}

async function collectProjectIds(repoPath: BoardTarget, fs: BoardFs, additional: readonly TaskProjectId[] = []): Promise<TaskProjectId[]> {
  const listed = await fs.exists(rootAgentsAbsPath(repoPath)) ? await listProjectIds(repoPath, fs) : [];
  const ids: TaskProjectId[] = [DEFAULT_TASK_PROJECT];
  for (const id of new Set([...listed, ...additional])) {
    if (id !== DEFAULT_TASK_PROJECT) {
      ids.push(id);
    }
  }
  return ids;
}

export async function readProjectRecord(
  repoPath: BoardTarget,
  id: TaskProjectId,
  fs: BoardFs,
): Promise<TaskProjectRecord> {
  const rel = projectAgentsRelPath(id, repoPath);
  const abs = projectAgentsAbsPath(repoPath, id);
  if (!(await fs.exists(abs))) {
    if (!(await listProjectIds(repoPath, fs)).includes(id)) {
      throw new TasksError("PROJECT_NOT_FOUND", `project not found: ${id}`);
    }
    return {
      project: id,
      dir: projectDirName(id),
      title: seedTitleFor(id),
      description: seedDescriptionFor(id),
      path: rel,
    };
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

/** Register only an existing owner entry. For a content scope this is its
 * co-located AGENTS harness; a fresh scope does not opt into Project Memory. */
function ownerBoardChange(target: BoardTarget): FileChange | undefined {
  const scope = realpathSync(scopeDir(target));
  const entry = path.join(scope, "AGENTS.md");
  const before = readEntry(entry);
  if (!before) return undefined;
  const node = new InternalNode(entry).parse(before.source);
  if (decodeBody(node.body).unsafe)
    throw new TasksError("VALIDATION_ERROR", "Malformed owning scope index: " + entry);

  const board = path.resolve(scope, boardRel(target), "AGENTS.md");
  const maintenance = boardRel(target) === path.join(".harness", "tasks");
  if (!node.children.some(ref => ref.id === board))
    node.addChild(maintenance ? "local" : "descendant", { id: board });
  else if (maintenance && node.descendantChildren.some(ref => ref.id === board))
    node.moveChild(board, "local");
  // Keep existing domain relation groups, labels, descriptions and source spelling.
  const source = node.serialize();
  return source === before.source ? undefined : { path: entry, before, source };
}

export async function refreshProjectIndex(
  repoPath: BoardTarget,
  writer: BoardWriter,
  additional: readonly TaskProjectId[] = [],
): Promise<TaskProjectRecord[]> {
  const records: TaskProjectRecord[] = [];
  for (const id of await collectProjectIds(repoPath, writer, additional)) {
    const abs = projectAgentsAbsPath(repoPath, id);
    if (!(await writer.exists(abs))) {
      continue;
    }
    records.push(await readProjectRecord(repoPath, id, writer));
  }

  const rootAbs = rootAgentsAbsPath(repoPath);
  const existing = (await writer.exists(rootAbs)) ? await writer.readFile(rootAbs) : "";
  const owner = ownerBoardChange(repoPath);
  await writer.writeFile(rootAbs, rewriteRootAgents(existing, records, rootAbs));
  if (owner) saveEntries([owner]);
  return records;
}

export async function ensureProjectMetadata(
  repoPath: BoardTarget,
  writer: BoardWriter,
  skipId?: TaskProjectId,
  additional: readonly TaskProjectId[] = [],
): Promise<TaskProjectRecord[]> {
  await writer.mkdirp(path.join(boardRoot(repoPath), projectDirName(DEFAULT_TASK_PROJECT)));

  for (const id of await collectProjectIds(repoPath, writer, additional)) {
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

  return refreshProjectIndex(repoPath, writer, additional);
}

export async function listProjects(
  repoPath: BoardTarget,
  writer: BoardWriter,
): Promise<TaskProjectRecord[]> {
  const records: TaskProjectRecord[] = [];
  for (const id of await listProjectIds(repoPath, writer)) {
    records.push(await readProjectRecord(repoPath, id, writer));
  }
  return records;
}

export async function getProject(
  repoPath: BoardTarget,
  raw: string,
  writer: BoardWriter,
): Promise<TaskProjectRecord> {
  const id = parseTaskProject(raw);
  return readProjectRecord(repoPath, id, writer);
}

export async function createProject(
  repoPath: BoardTarget,
  input: { project: string; title: string; description: string },
  writer: BoardWriter,
): Promise<TaskProjectRecord> {
  const id = parseTaskProject(input.project);
  const title = parseProjectTitle(input.title);
  const description = parseProjectDescription(input.description);
  await ensureProjectMetadata(repoPath, writer, id);
  const rel = projectAgentsRelPath(id, repoPath);
  if (await writer.exists(path.join(scopeDir(repoPath), rel))) {
    throw new TasksError("VALIDATION_ERROR", `project already exists: ${id}`);
  }
  await writer.mkdirp(path.join(boardRoot(repoPath), projectDirName(id)));
  await writer.writeFile(path.join(scopeDir(repoPath), rel), renderProjectAgents({ title, description }));
  await refreshProjectIndex(repoPath, writer, [id]);
  return {
    project: id,
    dir: projectDirName(id),
    title,
    description,
    path: rel,
  };
}

export async function updateProject(
  repoPath: BoardTarget,
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
  // A named write may seed its existing project directory without discovering siblings.
  const projectExists = await writer.exists(path.join(boardRoot(repoPath), projectDirName(id)));
  await ensureProjectMetadata(repoPath, writer, undefined, projectExists ? [id] : []);
  const rel = projectAgentsRelPath(id, repoPath);
  const abs = path.join(scopeDir(repoPath), rel);
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
    renderProjectAgents({ title, description, pointers: parsed.pointers, tail: parsed.tail }),
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
