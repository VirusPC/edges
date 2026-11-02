#!/usr/bin/env node
/** Promote Task Project directories into recursive Projects. Preview first; persist
 * the immutable plan before --apply so the same plan can resume interrupted work.
 * NodeService owns node moves/edits; files and run logs stay in their directory units.
 */
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { BaseNode, ProjectNode, ReadmeNode, TaskNode } from "../../packages/cli/src/domain/models/index.js";
import { TASK_STATUSES } from "../../packages/cli/src/domain/models/tasks/types.js";
import { domainFields } from "../../packages/cli/src/domain/core/fields.js";
import { identifyNodeType } from "../../packages/cli/src/domain/models/node/layout.js";
import { placeHarnessMaterial } from "../../packages/cli/src/domain/config/edges-materials.js";
import { NodeService } from "../../packages/cli/src/services/node/node-service.js";
import { modelAt, rewriteLinks } from "../../packages/cli/src/services/node/node-layout.js";
import { acquireWriteLock } from "../../packages/cli/src/services/node/node-lock.js";
import { checkPath } from "../../packages/cli/src/services/node/node-files.js";
import { ensureMaterialOrg } from "../../packages/cli/src/services/node/content-org-list.js";

interface FileRecord { relative: string; sha256: string; normalized?: string }
interface TaskRecord { relative: string; stem: string; status: string; name: string; description?: string }
export interface GroupMigration {
  name: string;
  source: string;
  destination: string;
  date?: string;
  project?: string;
  /** Original README is retained in the plan, including the default group's prose. */
  readme: string;
  projectSource?: string;
  tasks: TaskRecord[];
  missingReferences: string[];
  unindexedTasks: string[];
  files: FileRecord[];
}
export interface RecursiveProjectsPlan {
  version: 1;
  root: string;
  groups: GroupMigration[];
  conflicts: string[];
  totals: { projects: number; tasks: number; defaultTasks: number; runLogs: number; resources: number; resourceBytes: number };
}
const hash = (source: string | Buffer) => createHash("sha256").update(source).digest("hex");
const inside = (file: string, root: string) => file === root || file.startsWith(root + path.sep);
const statuses = new Set<string>(TASK_STATUSES);
const isDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value + "T00:00:00Z")) && new Date(value + "T00:00:00Z").toISOString().slice(0, 10) === value;
const entryName = (file: string) => ["INDEX.md", "index.md"].includes(path.basename(file));
const isTask = (relative: string) => {
  const parts = relative.split(path.sep);
  return parts.length === 3 && statuses.has(parts[0]!) && entryName(relative);
};

function inventory(directory: string): string[] {
  const files: string[] = [];
  function visit(dir: string) {
    for (const item of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const file = path.join(dir, item.name);
      if (item.isSymbolicLink()) throw new Error(`Symbolic link is not migratable: ${file}`);
      if (item.isDirectory()) visit(file);
      else if (item.isFile()) files.push(path.relative(directory, file));
      else throw new Error(`Unsupported resource: ${file}`);
    }
  }
  checkPath(directory);
  visit(directory);
  return files;
}
function stripTaskProject(node: BaseNode): boolean {
  let changed = false;
  if (node.metadata && "edges-task-project" in node.metadata) {
    node.removeMetadata("edges-task-project");
    changed = true;
  }
  const nested = node.metadata?.metadata;
  if (nested && typeof nested === "object" && !Array.isArray(nested) && "edges-task-project" in nested) {
    const next = { ...nested } as Record<string, unknown>;
    delete next["edges-task-project"];
    node.setMetadata("metadata", next);
    changed = true;
  }
  return changed;
}
function relocate(plan: RecursiveProjectsPlan, file: string): string {
  const group = plan.groups.find((item) => inside(file, item.source));
  return group ? path.join(group.destination, path.relative(group.source, file)) : file;
}
function registerTasks(node: ReadmeNode, group: GroupMigration): boolean {
  let changed = false;
  for (const task of group.tasks) {
    const id = path.join(group.destination, task.relative);
    if (!node.children.some((child) => child.id === id)) {
      node.addChild("local", { id, name: task.name, ...(task.description ? { description: task.description } : {}) });
      changed = true;
    }
  }
  return changed;
}
function normalize(plan: RecursiveProjectsPlan, source: string, from: string, to: string, task: boolean): string {
  const Model = modelAt(to) ?? BaseNode;
  const node = new Model(to).parse(rewriteLinks(source, from, to, (target) => relocate(plan, target)));
  if (task) stripTaskProject(node);
  const group = plan.groups.find((item) => item.project && to === path.join(item.destination, "README.md"));
  if (group && node instanceof ReadmeNode) registerTasks(node, group);
  return node.serialize();
}
function withoutChildren(source: string, file: string): string {
  const node = new ReadmeNode(file).parse(source);
  for (const child of node.children) node.removeChild(child.id);
  return node.serialize();
}
const defaultStart = "<!-- edges-migrated-task-default:start -->";
const defaultEnd = "<!-- edges-migrated-task-default:end -->";
function defaultSection(plan: RecursiveProjectsPlan, group: GroupMigration): string {
  const from = path.join(group.source, "README.md"), to = path.join(group.destination, "README.md");
  const prose = rewriteLinks(withoutChildren(group.readme, from), from, to, (target) => relocate(plan, target))
    .replace(/<!-- edges-entries-(?:local|descendants):(?:start|end) -->\s*\n?/g, "")
    .replace(/^---\n([\s\S]*?)\n---\n/, "```yaml\n$1\n```\n").trim();
  return `${defaultStart}\n## 原未分组任务说明\n\n${prose}\n${defaultEnd}`;
}
function checkDefaultSection(plan: RecursiveProjectsPlan, group: GroupMigration, body: string): boolean {
  const begin = body.indexOf(defaultStart), end = body.indexOf(defaultEnd);
  if (begin === -1 && end === -1) return false;
  if (begin === -1 || end < begin || body.indexOf(defaultStart, begin + 1) !== -1 || body.indexOf(defaultEnd, end + 1) !== -1 || body.slice(begin, end + defaultEnd.length) !== defaultSection(plan, group))
    throw new Error("Preserved default README differs from saved migration plan");
  return true;
}
async function preserveDefault(service: NodeService, plan: RecursiveProjectsPlan, group: GroupMigration): Promise<void> {
  const entry = path.join(group.destination, "README.md"), oldEntry = path.join(group.source, "README.md");
  const board = (await service.get(entry, ReadmeNode))!;
  const hadChild = board.children.some((child) => child.id === oldEntry);
  if (hadChild) board.removeChild(oldEntry);
  const present = checkDefaultSection(plan, group, board.body);
  if (!present) board.body = `${board.body.trimEnd()}\n\n${defaultSection(plan, group)}\n`;
  if (hadChild || !present) await service.update(board, {});
  // Only current registered nodes participate; historical documents and run logs
  // are never searched or rewritten. Remove the old composition edge first so
  // mapping the former group entry cannot introduce a self-edge on the board.
  const nodes = await service.query(plan.root, { includeHarness: true, super: !fs.existsSync(path.join(plan.root, "AGENTS.md")) }).toArray().value();
  for (const node of nodes) {
    if (inside(node.path, group.source)) continue;
    const current = node.serialize();
    const next = rewriteLinks(current, node.path, node.path, (target) => inside(target, group.source) ? path.join(group.destination, path.relative(group.source, target)) : target);
    if (next !== current) { node.parse(next); await service.update(node, {}); }
  }
}

/** No writes, no node mutation. Unknown default-group resources are conflicts. */
export function planRecursiveProjects(inputRoot: string, dates: Record<string, string> = {}): RecursiveProjectsPlan {
  if (!path.isAbsolute(inputRoot)) throw new Error("--root must be absolute");
  const root = checkPath(inputRoot);
  const board = path.dirname(placeHarnessMaterial(root, "tasks").absPath);
  const projects = path.dirname(placeHarnessMaterial(root, "projects").absPath);
  const plan: RecursiveProjectsPlan = { version: 1, root, groups: [], conflicts: [], totals: { projects: 0, tasks: 0, defaultTasks: 0, runLogs: 0, resources: 0, resourceBytes: 0 } };
  if (!fs.existsSync(board)) return plan;
  const targets = new Set<string>();
  for (const item of fs.readdirSync(board, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (item.isSymbolicLink()) { plan.conflicts.push(`Symbolic link: ${path.join(board, item.name)}`); continue; }
    if (!item.isDirectory() || statuses.has(item.name) || item.name.startsWith(".") || item.name === "node_modules") continue;
    const source = path.join(board, item.name);
    const readmePath = path.join(source, "README.md");
    if (!fs.existsSync(readmePath)) { plan.conflicts.push(`Unrecognized legacy group without README: ${source}`); continue; }
    try {
      const names = inventory(source);
      const tasks = names.filter(isTask).map((relative) => {
        const task = new TaskNode(path.join(source, relative)).parse(fs.readFileSync(path.join(source, relative), "utf8"));
        if (task.status !== relative.split(path.sep)[0]) plan.conflicts.push(`Task status and directory disagree: ${path.join(source, relative)}`);
        const expectedGroup = item.name === "_default" ? "default" : item.name;
        const recordedGroup = domainFields(task.metadata)["edges-task-project"] || "default";
        if (recordedGroup !== expectedGroup || (task.metadata?.["edges-task-project"] !== undefined && task.metadata["edges-task-project"] !== expectedGroup))
          plan.conflicts.push(`Task project and directory disagree: ${path.join(source, relative)}`);
        return { relative, status: relative.split(path.sep)[0]!, stem: relative.split(path.sep)[1]!, name: task.title, ...(task.description ? { description: task.description } : {}) };
      });
      const readme = fs.readFileSync(readmePath, "utf8");
      const index = new ReadmeNode(readmePath).parse(readme);
      const missingReferences = index.children.filter((child) => !fs.existsSync(child.id)).map((child) => path.relative(source, child.id));
      const unindexedTasks = tasks.filter((task) => !index.children.some((child) => child.id === path.join(source, task.relative))).map((task) => task.relative);
      const stems = new Set<string>();
      const taskDates: string[] = [];
      for (const task of tasks) {
        if (identifyNodeType(path.join(source, task.relative)) !== "task") plan.conflicts.push(`Legacy Task layout is not recognized: ${path.join(source, task.relative)}`);
        const key = task.stem.normalize("NFC").toLowerCase();
        if (stems.has(key)) plan.conflicts.push(`Duplicate Task stem in ${source}: ${task.stem}`);
        stems.add(key);
        const date = task.stem.match(/^(\d{4}-\d{2}-\d{2})--/)?.[1];
        if (!date || !isDate(date)) plan.conflicts.push(`Task stem needs a valid date: ${path.join(source, task.relative)}`);
        else taskDates.push(date);
      }
      const date = taskDates.sort()[0] ?? dates[item.name];
      const project = item.name === "_default" ? undefined : date ? path.join(projects, `${date}--${item.name}`) : undefined;
      if (item.name !== "_default" && (!date || !isDate(date))) plan.conflicts.push(`Empty group needs an explicit valid date mapping: ${item.name}`);
      if (date && dates[item.name] && taskDates.length && date !== dates[item.name]) plan.conflicts.push(`Date mapping must match earliest Task date for ${item.name}: ${date}`);
      const destination = project ? path.dirname(placeHarnessMaterial(root, "tasks", { project }).absPath) : board;
      if (project) {
        const key = project.normalize("NFC").toLowerCase();
        if (targets.has(key) || fs.existsSync(project)) plan.conflicts.push(`Project target already exists or collides: ${project}`);
        targets.add(key);
      }
      if (item.name === "_default") {
        for (const name of names) {
          const belongs = tasks.some((task) => inside(path.join(source, name), path.dirname(path.join(source, task.relative))));
          if (!belongs && name !== "README.md" && path.basename(name) !== ".gitkeep") plan.conflicts.push(`Default group resource needs an explicit preservation plan: ${path.join(source, name)}`);
        }
        for (const task of tasks) {
          for (const status of TASK_STATUSES) {
            const existing = path.join(board, status, task.stem);
            if (fs.existsSync(existing)) plan.conflicts.push(`Default Task target/stem already exists: ${existing}`);
          }
        }
      }
      const files = names.map((relative) => ({ relative, sha256: hash(fs.readFileSync(path.join(source, relative))) }));
      plan.groups.push({ name: item.name, source, destination, date, project, readme, tasks, missingReferences, unindexedTasks, files });
    } catch (error) { plan.conflicts.push(String(error)); }
  }
  for (const group of plan.groups) {
    if (group.project) {
      const original = path.join(group.source, "README.md");
      const target = path.join(group.project, "INDEX.md");
      group.projectSource = normalize(plan, withoutChildren(group.readme, original), original, target, false);
    }
    for (const file of group.files) {
      const from = path.join(group.source, file.relative), to = path.join(group.destination, file.relative);
      if (identifyNodeType(from)) file.normalized = hash(normalize(plan, fs.readFileSync(from, "utf8"), from, to, isTask(file.relative)));
      if (/\.log\.md$/.test(file.relative)) plan.totals.runLogs++;
      else if (!file.normalized && path.basename(file.relative) !== ".gitkeep") {
        plan.totals.resources++;
        plan.totals.resourceBytes += fs.statSync(from).size;
      }
    }
    plan.totals.tasks += group.tasks.length;
    if (group.project) plan.totals.projects++;
    else plan.totals.defaultTasks += group.tasks.length;
  }
  return plan;
}

function verifyPlan(plan: RecursiveProjectsPlan): void {
  if (plan.version !== 1 || !path.isAbsolute(plan.root)) throw new Error("Unsupported migration plan");
  checkPath(plan.root);
  if (plan.conflicts.length) throw new Error("Conflicts block apply:\n" + plan.conflicts.join("\n"));
  const board = path.dirname(placeHarnessMaterial(plan.root, "tasks").absPath);
  const projects = path.dirname(placeHarnessMaterial(plan.root, "projects").absPath);
  for (const group of plan.groups) {
    if (!group.name || path.basename(group.name) !== group.name || group.name.startsWith(".") || statuses.has(group.name)) throw new Error(`Invalid group in plan: ${group.name}`);
    const expectedProject = group.name === "_default" ? undefined : group.date && isDate(group.date) ? path.join(projects, `${group.date}--${group.name}`) : undefined;
    const expectedDestination = expectedProject ? path.dirname(placeHarnessMaterial(plan.root, "tasks", { project: expectedProject }).absPath) : board;
    if (group.source !== path.join(board, group.name) || group.project !== expectedProject || group.destination !== expectedDestination || (group.name !== "_default" && !expectedProject)) throw new Error(`Plan layout does not match the migration: ${group.name}`);
    for (const file of group.files) if (path.isAbsolute(file.relative) || file.relative.split(path.sep).includes("..")) throw new Error(`Invalid file in plan: ${file.relative}`);
    for (const task of group.tasks) if (!isTask(task.relative) || !group.files.some((file) => file.relative === task.relative)) throw new Error(`Invalid Task in plan: ${task.relative}`);
    for (const directory of [group.source, group.destination, ...(group.project ? [group.project] : [])]) {
      if (!inside(directory, plan.root) || directory === plan.root) throw new Error(`Plan path escapes scope: ${directory}`);
      checkPath(directory);
    }
    if (group.project && fs.existsSync(group.project)) {
      const allowed = new Set(["INDEX.md", path.basename(group.destination)]);
      for (const name of fs.readdirSync(group.project)) if (!allowed.has(name)) throw new Error(`Unplanned Project resource: ${path.join(group.project, name)}`);
      const entry = path.join(group.project, "INDEX.md");
      if (!fs.existsSync(entry) || withoutChildren(fs.readFileSync(entry, "utf8"), entry) !== withoutChildren(group.projectSource!, entry)) throw new Error(`Project differs from saved migration plan: ${entry}`);
    }
    const sourceExists = fs.existsSync(group.source);
    const destinationExists = group.project && fs.existsSync(group.destination);
    if (sourceExists && destinationExists) throw new Error(`Both source and destination exist: ${group.source}`);
    if (!group.project) for (const task of group.tasks) {
      const sourceUnit = path.dirname(path.join(group.source, task.relative));
      const destinationUnit = path.dirname(path.join(group.destination, task.relative));
      checkPath(destinationUnit);
      if (fs.existsSync(sourceUnit) && fs.existsSync(destinationUnit)) throw new Error(`Default Task destination already exists: ${destinationUnit}`);
      for (const status of TASK_STATUSES)
        if (status !== task.status && fs.existsSync(path.join(group.destination, status, task.stem))) throw new Error(`Default Task stem already exists: ${task.stem}`);
      if (fs.existsSync(destinationUnit)) for (const name of inventory(destinationUnit)) {
        const relative = path.join(task.status, task.stem, name);
        if (!group.files.some((file) => file.relative === relative)) throw new Error(`Unplanned resource: ${path.join(destinationUnit, name)}`);
      }
    }
    if (!group.project && sourceExists) {
      const index = path.join(group.source, "README.md");
      const current = fs.readFileSync(index, "utf8");
      const prose = (source: string) => withoutChildren(normalize(plan, source, index, index, false), index);
      if (prose(current) !== prose(group.readme)) throw new Error(`Default README changed since preview: ${index}`);
      const expected = new ReadmeNode(index).parse(group.readme).children.map((child) => child.id);
      for (const child of new ReadmeNode(index).parse(current).children)
        if (!expected.includes(child.id)) throw new Error(`Unplanned default group child: ${child.id}`);
    }
    if (!group.project) checkDefaultSection(plan, group, new ReadmeNode(path.join(board, "README.md")).parse(fs.readFileSync(path.join(board, "README.md"), "utf8")).body);
    const known = new Set(group.files.map((file) => file.relative));
    for (const dir of [group.source, ...(group.project ? [group.destination] : [])]) {
      if (!fs.existsSync(dir)) continue;
      for (const name of inventory(dir)) if (!known.has(name)) throw new Error(`Unplanned resource: ${path.join(dir, name)}`);
    }
    for (const file of group.files) {
      const from = path.join(group.source, file.relative), to = path.join(group.destination, file.relative);
      checkPath(from);
      checkPath(to);
      const isDefaultIndex = !group.project && file.relative === "README.md";
      if (isDefaultIndex || (!group.project && path.basename(file.relative) === ".gitkeep")) continue;
      const locations = [from, to].filter((candidate) => fs.existsSync(candidate));
      if (locations.length !== 1) throw new Error(`Expected exactly one source/destination for ${from}`);
      const current = locations[0]!;
      checkPath(current);
      const bytes = fs.readFileSync(current);
      const actual = file.normalized ? hash(normalize(plan, bytes.toString("utf8"), current, to, isTask(file.relative))) : hash(bytes);
      if (actual !== (file.normalized ?? file.sha256)) throw new Error(`Content changed since preview: ${current}`);
    }
  }
}

/** Resume from the same immutable plan. Every step is checked against source or final location. */
export async function applyRecursiveProjects(plan: RecursiveProjectsPlan, progress: (message: string) => void = () => {}): Promise<void> {
  const release = await acquireWriteLock(plan.root);
  try {
    verifyPlan(plan);
    if (!plan.groups.length) return;
    const service = new NodeService({ managedRoot: plan.root });
    const boardEntry = placeHarnessMaterial(plan.root, "tasks").absPath;
    if (plan.groups.some((group) => group.project))
      await ensureMaterialOrg(service, plan.root, "projects", "Projects", "按主题聚合的材料与子 Project。");
    for (const group of plan.groups) {
      progress(`Migrating ${group.name}: ${group.tasks.length} Tasks`);
      if (group.project) {
        const entry = path.join(group.project, "INDEX.md");
        if (!fs.existsSync(entry)) {
          const project = new ProjectNode(entry).parse(group.projectSource!);
          await service.create(project, { body: project.body, metadata: project.metadata });
        }
        const from = path.join(group.source, "README.md"), to = path.join(group.destination, "README.md");
        if (fs.existsSync(from)) {
          // A directory move persists dirty descendant drafts in the same lifecycle
          // operation, avoiding a full graph update for each Task's removed field.
          for (const task of group.tasks) stripTaskProject((await service.get(path.join(group.source, task.relative)))!);
          await service.move((await service.get(from))!, to);
        }
        // This group is now reached through projects/README -> P/INDEX -> tasks/README.
        const board = await service.get(boardEntry, ReadmeNode);
        if (board) {
          const removals = board.children.filter((child) => child.id === from || child.id === to);
          if (removals.length) {
            for (const child of removals) board.removeChild(child.id);
            await service.update(board, {});
          }
        }
        const project = (await service.get(entry, ProjectNode))!;
        if (!project.children.some((child) => child.id === to)) {
          project.addChild("local", { id: to, name: "Tasks", description: "本主题的任务。" });
          await service.update(project, {});
        }
      } else {
        for (const task of group.tasks) {
          const from = path.join(group.source, task.relative), to = path.join(group.destination, task.relative);
          if (fs.existsSync(from)) {
            const node = (await service.get(from))!;
            stripTaskProject(node);
            await service.move(node, to);
          }
        }
      }
      for (const task of group.tasks) {
        const node = (await service.get(path.join(group.destination, task.relative)))!;
        if (stripTaskProject(node)) await service.update(node, {});
      }
      if (!group.project) {
        progress("Preserving default README");
        await preserveDefault(service, plan, group);
        progress("Preserved default README and incoming links");
        if (fs.existsSync(group.source)) {
          const remainder = inventory(group.source).filter((name) => name !== "README.md" && path.basename(name) !== ".gitkeep");
          if (remainder.length) throw new Error(`Default group is not empty after migration: ${remainder.join(", ")}`);
          const node = await service.get(path.join(group.source, "README.md"));
          if (!node) throw new Error(`Missing default group README: ${group.source}`);
          await service.destroy(node);
        }
        progress("Removed default README");
      }
      const tasksIndex = (await service.get(path.join(group.destination, "README.md"), ReadmeNode))!;
      if (registerTasks(tasksIndex, group)) await service.update(tasksIndex, {});
      progress(`Completed ${group.name}`);
    }
    // A default group is removed rather than moved as a unit. Rebase any authored
    // links to that old group, using only the moved nodes, never historical files.
    for (const group of plan.groups) for (const file of group.files) {
      if (!file.normalized || (!group.project && file.relative === "README.md")) continue;
      const target = path.join(group.destination, file.relative);
      const node = (await service.get(target))!;
      const current = node.serialize();
      const final = normalize(plan, current, target, target, isTask(file.relative));
      if (final !== current) {
        node.parse(final);
        await service.update(node, {});
      }
    }
    verifyPlan(plan);
  } finally { await release(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const args = process.argv.slice(2).filter((arg) => arg !== "--");
    const values: Record<string, string> = {};
    let apply = false;
    for (let i = 0; i < args.length; i++) {
      const arg = args[i]!;
      if (arg === "--apply") apply = true;
      else if (["--root", "--plan", "--dates"].includes(arg) && args[i + 1]) values[arg] = args[++i]!;
      else throw new Error("Usage: recursive-projects.mts --root /absolute/scope [--plan /path/plan.json] [--dates /path/dates.json] [--apply]");
    }
    if (!values["--root"]) throw new Error("--root is required");
    if (apply && !values["--plan"]) throw new Error("--apply requires --plan so interrupted work can resume from the saved plan");
    const planFile = values["--plan"] ? path.resolve(values["--plan"]) : undefined;
    const plan: RecursiveProjectsPlan = planFile && fs.existsSync(planFile)
      ? JSON.parse(fs.readFileSync(planFile, "utf8"))
      : planRecursiveProjects(values["--root"], values["--dates"] ? JSON.parse(fs.readFileSync(values["--dates"], "utf8")) : {});
    if (plan.root !== path.resolve(values["--root"])) throw new Error("Saved plan scope does not match --root");
    if (planFile && !fs.existsSync(planFile)) {
      fs.mkdirSync(path.dirname(planFile), { recursive: true });
      fs.writeFileSync(planFile, JSON.stringify(plan, null, 2) + "\n", { flag: "wx" });
    }
    process.stdout.write(JSON.stringify({ root: plan.root, totals: plan.totals, groups: plan.groups.map(({ name, date, destination, tasks, missingReferences, unindexedTasks }) => ({ name, date, destination, tasks: tasks.length, missingReferences, unindexedTasks })), conflicts: plan.conflicts }, null, 2) + "\n");
    if (plan.conflicts.length) process.exitCode = 1;
    else if (apply) { await applyRecursiveProjects(plan, (message) => process.stdout.write(message + "\n")); process.stdout.write("Applied and verified. Saved plan is safe to re-run.\n"); }
    else process.stdout.write("Preview only. Apply with the same --plan file and --apply.\n");
  } catch (error) { process.stderr.write(String(error) + "\n"); process.exitCode = 1; }
}
