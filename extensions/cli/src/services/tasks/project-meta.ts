import { AgentsNode } from "../../domain/models/internal/agents-node.js";
import { ReadmeNode } from "../../domain/models/readme/readme-node.js";
import { decodeBody } from '../../domain/models/internal/parse.js';
import { createAgentsDocument } from "../../domain/models/internal/document.js";
import { serializeNode } from '../../domain/models/internal/serialize.js';
import { NodeService } from '../node/node-service.js';
import { assertBoardPath } from './board.js';
import { scopeDir, boardRel, type BoardTarget } from "./paths.js";
import path from "node:path";
import { realpathSync } from "node:fs";
import { existsSync } from "node:fs";
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
  const boundary = body.search(
    /^(?:## |<!-- (?:project-harness|project-memory|project-entries|task-projects)(?::|-))/m,
  );
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
  return out + "\n" + serializeNode(createAgentsDocument());
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

export function projectAgentsRelPath(id: TaskProjectId, target: BoardTarget = ""): string {
  return `${boardRel(target)}/${projectDirName(id)}/AGENTS.md`;
}

function projectReadmeRelPath(id: TaskProjectId, target: BoardTarget = ""): string {
  return `${boardRel(target)}/${projectDirName(id)}/README.md`;
}

/** A Task Project's entry: its own AGENTS.md (real system entry or seed) or, once migrated,
 * the README.md that holds its project-entries org list. AGENTS wins when both exist. */
async function resolveProjectEntry(
  repoPath: BoardTarget,
  id: TaskProjectId,
  fs: BoardFs,
): Promise<{ rel: string; abs: string; exists: boolean; kind: "agents" | "readme" }> {
  const scope = realpathSync(scopeDir(repoPath));
  const agents = projectAgentsRelPath(id, repoPath);
  if (await fs.exists(path.join(scope, agents)))
    return { rel: agents, abs: path.join(scope, agents), exists: true, kind: "agents" };
  const readme = projectReadmeRelPath(id, repoPath);
  if (await fs.exists(path.join(scope, readme)))
    return { rel: readme, abs: path.join(scope, readme), exists: true, kind: "readme" };
  return { rel: agents, abs: path.join(scope, agents), exists: false, kind: "agents" };
}

function rootAgentsAbsPath(repoPath: BoardTarget): string {
  return path.join(realpathSync(scopeDir(repoPath)), boardRel(repoPath), "AGENTS.md");
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
  const entry = await resolveProjectEntry(repoPath, id, fs);
  if (!entry.exists) {
    if (!(await listProjectIds(repoPath, fs)).includes(id)) {
      throw new TasksError("PROJECT_NOT_FOUND", `project not found: ${id}`);
    }
    return {
      project: id,
      dir: projectDirName(id),
      title: seedTitleFor(id),
      description: seedDescriptionFor(id),
      path: entry.rel,
    };
  }
  const parsed = parseProjectAgents(await fs.readFile(entry.abs));
  return {
    project: id,
    dir: projectDirName(id),
    title: parsed.title,
    description: parsed.description,
    path: entry.rel,
  };
}

function projectNodes(target: BoardTarget): NodeService {
  const scope = realpathSync(scopeDir(target)), owner = path.join(scope, 'AGENTS.md');
  return new NodeService({ managedRoot: scope, assertWrite: async ({ node }) => {
    if (node.path === owner && existsSync(owner)) return;
    await assertBoardPath({ scopeDir: scope, purpose: typeof target === "string" ? "domain" : target.purpose, boardDir: path.join(scope, boardRel(target)) }, node.path);
  } });
}
function selectedGroup(target: BoardTarget) { return typeof target === 'string' ? undefined : target.indexGroup; }
async function prepareProjectWrite(target: BoardTarget, service: NodeService): Promise<void> {
  await assertBoardPath(target, rootAgentsAbsPath(target));
  const owner = await service.get(path.join(realpathSync(scopeDir(target)), 'AGENTS.md'), AgentsNode);
  const board = path.join(realpathSync(scopeDir(target)), boardRel(target), 'AGENTS.md');
  for (const file of [owner?.path, board]) {
    if (!file) continue;
    const node = file === owner?.path ? owner : await service.get(file, AgentsNode);
    if (node && /<!-- task-projects:(?:start|end) -->/.test(node.body))
      throw new TasksError('VALIDATION_ERROR', 'migration-required: run pnpm --filter edges-cli exec tsx ../../scripts/migrate-agents-indexes.mts --root ' + scopeDir(target) + ' --write');
  }
  if (owner && decodeBody(owner.body).unsafe) throw new TasksError('VALIDATION_ERROR', 'Malformed owning scope index: ' + owner.path);
  if (owner && !owner.children.some(ref => ref.id === board) && !selectedGroup(target))
    throw new TasksError('VALIDATION_ERROR', 'New owner registration requires --index-group local|descendant');
}

export async function refreshProjectIndex(
  repoPath: BoardTarget,
  writer: BoardWriter,
  additional: readonly TaskProjectId[] = [],
  service = projectNodes(repoPath),
): Promise<TaskProjectRecord[]> {
  await prepareProjectWrite(repoPath, service);
  const records: TaskProjectRecord[] = [];
  for (const id of await collectProjectIds(repoPath, writer, additional)) {
    if (!(await resolveProjectEntry(repoPath, id, writer)).exists) {
      continue;
    }
    records.push(await readProjectRecord(repoPath, id, writer));
  }

  const rootAbs = rootAgentsAbsPath(repoPath);
  let board = await service.get(rootAbs, AgentsNode);
  if (!board) board = await service.create(new AgentsNode(rootAbs), { body: '# Tasks\n\n' + serializeNode(createAgentsDocument()) }, { indexGroup: selectedGroup(repoPath) });
  const updates = new Map(sortProjectRecords(records).map(record => [path.resolve(path.dirname(rootAbs), record.dir, path.basename(record.path)), { name: record.title, description: oneLineDescription(record.description) }]));
  const update = (refs: typeof board.localChildren) => refs.map(ref => updates.has(ref.id) ? { ...ref, ...updates.get(ref.id) } : ref);
  const localChildren = update(board.localChildren), descendantChildren = update(board.descendantChildren);
  for (const [id, fields] of updates) if (!board.children.some(ref => ref.id === id)) localChildren.push({ id, ...fields });
  await service.update(board, { localChildren, descendantChildren });
  const owner = await service.get(path.join(realpathSync(scopeDir(repoPath)), 'AGENTS.md'), AgentsNode);
  if (owner && !owner.children.some(ref => ref.id === board.id)) {
    const group = selectedGroup(repoPath)!; // prepareProjectWrite requires an explicit choice.
    await service.update(owner, {
      localChildren: group === 'local' ? [...owner.localChildren, { id: board.id }] : owner.localChildren,
      descendantChildren: group === 'descendant' ? [...owner.descendantChildren, { id: board.id }] : owner.descendantChildren,
    });
  }
  return records;
}

export async function ensureProjectMetadata(
  repoPath: BoardTarget,
  writer: BoardWriter,
  skipId?: TaskProjectId,
  additional: readonly TaskProjectId[] = [],
  service = projectNodes(repoPath),
): Promise<TaskProjectRecord[]> {
  await prepareProjectWrite(repoPath, service);
  const rootAbs = rootAgentsAbsPath(repoPath);
  if (!await service.get(rootAbs, AgentsNode)) await service.create(new AgentsNode(rootAbs), { body: "# Tasks\n\n" + serializeNode(createAgentsDocument()) }, { indexGroup: selectedGroup(repoPath) });

  for (const id of await collectProjectIds(repoPath, writer, additional)) {
    if (skipId === id) {
      continue;
    }
    const entry = await resolveProjectEntry(repoPath, id, writer);
    if (!entry.exists) {
      await service.create(new AgentsNode(entry.abs), { body: renderProjectAgents({
          title: seedTitleFor(id),
          description: seedDescriptionFor(id),
        }) }, { indexGroup: "local" });
    } else {
      await readProjectRecord(repoPath, id, writer);
    }
  }

  return refreshProjectIndex(repoPath, writer, additional, service);
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
  const service = projectNodes(repoPath);
  await ensureProjectMetadata(repoPath, writer, id, [], service);
  const rel = projectAgentsRelPath(id, repoPath);
  if ((await resolveProjectEntry(repoPath, id, writer)).exists) {
    throw new TasksError("VALIDATION_ERROR", `project already exists: ${id}`);
  }
  await service.create(new AgentsNode(path.join(realpathSync(scopeDir(repoPath)), rel)), { body: renderProjectAgents({ title, description }) }, { indexGroup: "local" });
  await refreshProjectIndex(repoPath, writer, [id], service);
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
  const service = projectNodes(repoPath);
  await ensureProjectMetadata(repoPath, writer, undefined, projectExists ? [id] : [], service);
  const entry = await resolveProjectEntry(repoPath, id, writer);
  const rel = entry.rel;
  if (!entry.exists) {
    throw new TasksError("PROJECT_NOT_FOUND", `project not found: ${id}`);
  }
  const node = entry.kind === "readme"
    ? (await service.get(entry.abs, ReadmeNode))!
    : (await service.get(entry.abs, AgentsNode))!;
  const parsed = parseProjectAgents(node.body);
  const title = patch.title === undefined ? parsed.title : parseProjectTitle(patch.title);
  const description =
    patch.description === undefined
      ? parsed.description
      : parseProjectDescription(patch.description);
  const body = renderProjectAgents({
    title,
    description,
    pointers: parsed.pointers,
    tail: parsed.tail ?? (entry.kind === "readme" ? "\n" : undefined),
  });
  if (entry.kind === "readme") await service.update(node as ReadmeNode, { body });
  else await service.update(node as AgentsNode, { body });
  await refreshProjectIndex(repoPath, writer, [], service);
  return {
    project: id,
    dir: projectDirName(id),
    title,
    description,
    path: rel,
  };
}
