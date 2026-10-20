#!/usr/bin/env node
/**
 * Move README-backed Task Project links out of each task board AGENTS.md into the board
 * README.md org list (`project-entries-local`), per the dual-file contract: system-one
 * children live only in README entries; the board AGENTS keeps system entries.
 *
 *  - Boards: `<scope>/tasks/AGENTS.md` and `<scope>/.harness/tasks/AGENTS.md` below --root.
 *  - Legacy `task-projects` blocks are first converted to ordinary local references.
 *  - Only `<board>/<project>/README.md` links move; `<project>/AGENTS.md` system entries stay.
 *  - An existing prose README keeps its text and gains the entries list.
 *
 * Preview by default; `--apply` writes. Safe to re-run: a migrated tree plans nothing.
 * A board README already listing the same project with different text is a conflict.
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { AgentsNode, ReadmeNode } from "../extensions/cli/src/domain/models/index.js";
import { acquireWriteLock } from "../extensions/cli/src/services/node/node-lock.js";
import { isGitBoundary } from "../extensions/cli/src/services/scope.js";
import {
  checkPath,
  readEntry,
  saveEntries,
  validateEntry,
  type EntryFile,
} from "../extensions/cli/src/services/node/node-files.js";
import { convert as convertLegacyTaskProjects } from "./migrate-agents-indexes.mts";

const excluded = new Set([".git", "node_modules", "dist", "build", "posts", ".agents", ".superpowers", ".obsidian"]);

export interface BoardMigration {
  board: string;
  moved: string[];
  edits: Array<{ path: string; before?: EntryFile; source: string }>;
}
export interface TaskProjectListPlan {
  root: string;
  boards: BoardMigration[];
  conflicts: string[];
}

function boardsUnder(root: string): string[] {
  const boards: string[] = [];
  function visit(dir: string) {
    if (dir !== root && isGitBoundary(dir)) return;
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      if (item.isSymbolicLink() || excluded.has(item.name) || !item.isDirectory()) continue;
      const child = path.join(dir, item.name);
      if (item.name === "tasks" && fs.existsSync(path.join(child, "AGENTS.md"))) boards.push(child);
      visit(child);
    }
  }
  visit(root);
  return boards.sort();
}

function planBoard(board: string, conflicts: string[]): BoardMigration | undefined {
  const agentsFile = readEntry(path.join(board, "AGENTS.md"))!;
  const agents = new AgentsNode(agentsFile.path).parse(convertLegacyTaskProjects(agentsFile.path, agentsFile.source));
  const isProjectList = (id: string) =>
    path.basename(id) === "README.md" && path.dirname(path.dirname(id)) === board;
  const moving = agents.children.filter((ref) => isProjectList(ref.id));
  const legacy = agents.serialize() !== agentsFile.source;
  if (!moving.length && !legacy) return undefined;
  for (const ref of moving) agents.removeChild(ref.id);
  const agentsSource = agents.serialize().replace(
    /(<!-- project-harness-local:start -->)([\s\S]*?)(<!-- project-harness-local:end -->)/,
    (_, start: string, body: string, end: string) => start + body.replace(/\n{3,}/g, "\n\n") + end,
  );
  const edits: BoardMigration["edits"] = [{ path: agentsFile.path, before: agentsFile, source: agentsSource }];
  if (moving.length) {
    const readmePath = path.join(board, "README.md");
    const readmeFile = readEntry(readmePath);
    const readme = new ReadmeNode(readmePath).parse(readmeFile?.source ?? "# Tasks\n");
    for (const ref of moving) {
      const existing = readme.children.find((child) => child.id === ref.id);
      if (!existing) readme.addChild("local", ref);
      else if (existing.name !== ref.name || existing.description !== ref.description)
        conflicts.push(`${readmePath}: already lists ${ref.id} with different text`);
    }
    edits.push({ path: readmePath, before: readmeFile, source: readme.serialize() });
  }
  return { board, moved: moving.map((ref) => ref.id), edits };
}

export function planTaskProjectLists(inputRoot: string): TaskProjectListPlan {
  if (!path.isAbsolute(inputRoot)) throw new Error("--root must be absolute");
  const root = checkPath(inputRoot);
  const conflicts: string[] = [];
  const boards = boardsUnder(root).flatMap((board) => planBoard(board, conflicts) ?? []);
  return { root, boards, conflicts };
}

export async function applyTaskProjectLists(plan: TaskProjectListPlan): Promise<void> {
  if (plan.conflicts.length) throw new Error("Conflicts block apply:\n" + plan.conflicts.join("\n"));
  const release = await acquireWriteLock(plan.root);
  try {
    const edits = plan.boards.flatMap((board) => board.edits);
    for (const edit of edits) if (edit.before) validateEntry(edit.before);
    saveEntries(edits.map((edit) => ({ path: edit.path, before: edit.before, source: edit.source })));
  } finally {
    await release();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const args = process.argv.slice(2).filter((arg) => arg !== "--");
    const at = args.indexOf("--root");
    if (at < 0 || !args[at + 1] || args.some((arg, index) => index !== at + 1 && !["--root", "--apply"].includes(arg)))
      throw new Error("Usage: migrate-task-project-lists.mts --root /absolute/scope [--apply]");
    const plan = planTaskProjectLists(path.resolve(args[at + 1]!));
    const rel = (file: string) => path.relative(plan.root, file) || ".";
    for (const board of plan.boards) {
      process.stdout.write(`${rel(board.board)}: move ${board.moved.length} project link(s) to README.md\n`);
      for (const id of board.moved) process.stdout.write(`  - ${rel(id)}\n`);
    }
    for (const conflict of plan.conflicts) process.stdout.write(`CONFLICT ${conflict}\n`);
    if (!plan.boards.length) process.stdout.write("Nothing to migrate.\n");
    if (plan.conflicts.length) process.exitCode = 1;
    else if (args.includes("--apply")) {
      await applyTaskProjectLists(plan);
      process.stdout.write(`Applied ${plan.boards.length} board(s).\n`);
    } else if (plan.boards.length) process.stdout.write("Preview only; re-run with --apply to write.\n");
  } catch (error) {
    process.stderr.write(String(error) + "\n");
    process.exitCode = 1;
  }
}
