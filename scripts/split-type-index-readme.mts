#!/usr/bin/env node
/**
 * Type indexes live only in README.md. Empty co-located AGENTS.md stubs
 * under `.harness/{memory,skills}/<type>/` are removed.
 *
 * An AGENTS.md that still carries `project-memory-type` is converted to a
 * sibling README (`project-entries-*`, titles 本层内容 / 下层内容) and then
 * deleted. A boilerplate stub next to an existing type README is deleted
 * when it has no composition links. Memory and skills type directories are
 * treated the same. Private `users/` indexes are not rewritten.
 *
 * Layer links to those deleted files, and registration links to
 * `.harness/{tasks,evaluation,observation}/AGENTS.md` when a sibling README
 * exists, are retargeted to README.md. Layer and package AGENTS.md outside
 * type directories stay.
 *
 * Preview by default; `--apply` writes. Safe to re-run.
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { acquireWriteLock } from "../extensions/cli/src/services/node/node-lock.js";
import { isGitBoundary } from "../extensions/cli/src/services/scope.js";
import {
  checkPath,
  readEntry,
  saveEntries,
  validateEntry,
  type EntryFile,
  type FileChange,
} from "../extensions/cli/src/services/node/node-files.js";

const excluded = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "posts",
  ".obsidian",
]);

const TYPE_DIR = /(?:^|\/)\.harness\/(memory|skills)\/([^/]+)\/AGENTS\.md$/;
const PRIVATE_TYPE = /(?:^|\/)\.harness\/memory\/(?:users|private)\//;
const MATERIAL_BOARDS = ["tasks", "evaluation", "observation"] as const;

export interface SplitMigration {
  from: string;
  to: string;
  before: EntryFile;
  readme: string;
}
export interface StubDeletion {
  path: string;
  before: EntryFile;
  readme: string;
}
export interface LinkEdit {
  path: string;
  before: EntryFile;
  source: string;
}
export interface SplitPlan {
  root: string;
  migrations: SplitMigration[];
  deletions: StubDeletion[];
  linkEdits: LinkEdit[];
  skipped: { path: string; reason: string }[];
  conflicts: string[];
  snapshots: EntryFile[];
}

export function convertTypeIndexSource(source: string): string {
  let out = source
    .replaceAll("<!-- project-harness-local:", "<!-- project-entries-local:")
    .replaceAll("<!-- project-harness-descendants:", "<!-- project-entries-descendants:")
    .replaceAll("## 本层系统维护信息", "## 本层内容")
    .replaceAll("## 下层系统维护信息", "## 下层内容")
    .replaceAll("<!-- project-memory-entries:start -->", "<!-- project-entries-local:start -->\n## 本层内容\n")
    .replaceAll("<!-- project-memory-entries:end -->", "<!-- project-entries-local:end -->");
  out = out.replace(/^<!-- project-harness:(?:start|end) -->\r?\n?/gm, "");
  return out.replace(/\n{3,}/g, "\n\n").replace(/\s*$/, "\n");
}

function isOrgIndex(source: string): boolean {
  return (
    source.includes("<!-- project-memory-type:start -->") ||
    source.includes("<!-- project-entries-local:start -->") ||
    source.includes("<!-- project-entries-descendants:start -->") ||
    source.includes("<!-- project-memory-entries:start -->")
  );
}

function* walk(root: string): Generator<string> {
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop()!;
    if (dir !== root && isGitBoundary(dir)) continue;
    for (const item of fs.readdirSync(dir, { withFileTypes: true }).sort(
      (a, b) => a.name.localeCompare(b.name),
    )) {
      if (item.isSymbolicLink() || excluded.has(item.name)) continue;
      const file = path.join(dir, item.name);
      if (item.isDirectory()) stack.push(file);
      else if (item.isFile()) yield file;
    }
  }
}

const rel = (root: string, file: string) =>
  path.relative(root, file).split(path.sep).join("/");

const LINK = /\[([^\]\n]*)\]\((<([^>\n]+)>|([^)\s]+))/g;

const REGISTRATION_BLOCKS = [
  ["<!-- project-harness-local:start -->", "<!-- project-harness-local:end -->"],
  ["<!-- project-harness-descendants:start -->", "<!-- project-harness-descendants:end -->"],
  ["<!-- project-entries-local:start -->", "<!-- project-entries-local:end -->"],
  ["<!-- project-entries-descendants:start -->", "<!-- project-entries-descendants:end -->"],
] as const;

function insideRegistrationBlock(source: string, offset: number): boolean {
  for (const [start, end] of REGISTRATION_BLOCKS) {
    let from = 0;
    while (from <= offset) {
      const open = source.indexOf(start, from);
      if (open < 0 || open > offset) break;
      const close = source.indexOf(end, open + start.length);
      if (close < 0) break;
      if (offset < close) return true;
      from = close + end.length;
    }
  }
  return false;
}

export function retargetLinks(
  file: string,
  source: string,
  moved: ReadonlyMap<string, string>,
  registrationOnly: ReadonlySet<string> = new Set(),
): string {
  return source.replace(LINK, (whole, label: string, _all, angled, plain, offset: number) => {
    const raw: string = angled ?? plain;
    const [pathPart] = raw.split(/[#?]/, 1);
    if (!pathPart || /^[a-z][a-z0-9+.-]*:/i.test(pathPart)) return whole;
    let decoded: string;
    try {
      decoded = pathPart
        .split("/")
        .map((part) => decodeURIComponent(part))
        .join("/");
    } catch {
      return whole;
    }
    const target = path.resolve(path.dirname(file), decoded);
    const dest = moved.get(target);
    if (!dest || dest === file) return whole;
    if (registrationOnly.has(target) && !insideRegistrationBlock(source, offset))
      return whole;
    const swap = (text: string) =>
      text.slice(0, text.length - "AGENTS.md".length) + "README.md";
    const replaced = swap(pathPart) + raw.slice(pathPart.length);
    const shownLabel = label === decoded || label.endsWith("AGENTS.md") ? swap(label) : label;
    return angled
      ? `[${shownLabel}](<${replaced}>`
      : `[${shownLabel}](${replaced}`;
  });
}

export function planTypeIndexSplit(inputRoot: string): SplitPlan {
  if (!path.isAbsolute(inputRoot)) throw new Error("--root must be absolute");
  const root = checkPath(inputRoot);
  if (root.split(path.sep).includes("posts"))
    throw new Error("Protected posts cannot be migrated");
  const migrations: SplitMigration[] = [];
  const deletions: StubDeletion[] = [];
  const skipped: SplitPlan["skipped"] = [];
  const conflicts: string[] = [];
  const snapshots: EntryFile[] = [];
  const markdown: string[] = [];

  for (const file of walk(root)) {
    if (!file.endsWith(".md")) continue;
    markdown.push(file);
    if (path.basename(file) !== "AGENTS.md") continue;
    const id = rel(root, file);
    if (!TYPE_DIR.test(id) || !id.endsWith("/AGENTS.md")) continue;
    const before = readEntry(file);
    if (!before) continue;
    if (PRIVATE_TYPE.test(id)) {
      skipped.push({ path: id, reason: "private user memory is not migrated" });
      continue;
    }
    const readmePath = path.join(path.dirname(file), "README.md");
    if (!before.source.includes("<!-- project-memory-type:start -->")) {
      const readme = fs.existsSync(readmePath) ? readEntry(readmePath) : undefined;
      const hasLink = LINK.test(before.source);
      LINK.lastIndex = 0;
      if (readme && isOrgIndex(readme.source) && !hasLink) {
        snapshots.push(before);
        deletions.push({ path: file, before, readme: readmePath });
      } else {
        skipped.push({
          path: id,
          reason: "layer or registered system entry, not an empty type stub",
        });
      }
      continue;
    }
    const to = readmePath;
    if (fs.existsSync(to)) {
      const existing = readEntry(to);
      snapshots.push(before);
      if (existing && !existing.source.includes("<!-- project-memory-type:start -->")) {
        conflicts.push(`${rel(root, to)} already exists and is not a type index`);
        continue;
      }
    }
    snapshots.push(before);
    migrations.push({
      from: file,
      to,
      before,
      readme: convertTypeIndexSource(before.source),
    });
  }

  const moved = new Map<string, string>([
    ...migrations.map((m) => [m.from, m.to] as const),
    ...deletions.map((d) => [d.path, d.readme] as const),
  ]);
  const registrationOnly = new Set<string>();
  for (const board of MATERIAL_BOARDS) {
    for (const file of markdown) {
      if (path.basename(file) !== "AGENTS.md") continue;
      if (path.basename(path.dirname(file)) !== board) continue;
      // Only the scope harness board, not a domain `tasks/` system entry.
      if (path.basename(path.dirname(path.dirname(file))) !== ".harness") continue;
      const readme = path.join(path.dirname(file), "README.md");
      if (!fs.existsSync(readme)) continue;
      moved.set(file, readme);
      // Board AGENTS stays the system entry. Only composition lists switch to README.
      registrationOnly.add(file);
    }
  }

  const linkEdits: LinkEdit[] = [];
  const deleting = new Set(deletions.map((d) => d.path));
  if (moved.size)
    for (const file of markdown) {
      if (deleting.has(file)) continue;
      const migration = migrations.find((m) => m.from === file);
      const entry = migration ? undefined : readEntry(file);
      const source = migration ? migration.readme : entry?.source;
      if (source === undefined || !entry && !migration) continue;
      const base = migration ? migration.readme : entry!.source;
      const next = retargetLinks(migration ? migration.to : file, base, moved, registrationOnly);
      if (migration) {
        migration.readme = next;
        continue;
      }
      if (!entry || next === entry.source) continue;
      snapshots.push(entry);
      linkEdits.push({ path: file, before: entry, source: next });
    }

  return { root, migrations, deletions, linkEdits, skipped, conflicts, snapshots };
}

function applyPlan(plan: SplitPlan): void {
  if (plan.conflicts.length)
    throw new Error(`Conflicts:\n${plan.conflicts.join("\n")}`);
  for (const file of plan.snapshots) validateEntry(file);
  const changes: FileChange[] = [
    ...plan.migrations.flatMap((m): FileChange[] => {
      const readmeBefore = fs.existsSync(m.to) ? readEntry(m.to) : null;
      const writes: FileChange[] = [];
      if (!readmeBefore || readmeBefore.source !== m.readme)
        writes.push({
          path: m.to,
          ...(readmeBefore ? { before: readmeBefore } : {}),
          source: m.readme,
        });
      writes.push({ path: m.from, before: m.before });
      return writes;
    }),
    ...plan.deletions.map((d) => ({ path: d.path, before: d.before })),
    ...plan.linkEdits.map((edit) => ({
      path: edit.path,
      before: edit.before,
      source: edit.source,
    })),
  ];
  if (changes.length) saveEntries(changes);
}

export async function applyTypeIndexSplit(plan: SplitPlan): Promise<void> {
  const release = await acquireWriteLock(plan.root);
  try {
    applyPlan(plan);
  } finally {
    await release();
  }
}

export function formatSplitPlan(plan: SplitPlan): string {
  const lines: string[] = [];
  const rootRel = (file: string) => rel(plan.root, file);
  lines.push(
    `## type indexes split (${plan.migrations.length})`,
    ...plan.migrations.map((m) => `- ${rootRel(m.from)} → README.md (AGENTS.md deleted)`),
    "",
    `## empty type stubs deleted (${plan.deletions.length})`,
    ...plan.deletions.map((d) => `- ${rootRel(d.path)}`),
    "",
    `## link edits (${plan.linkEdits.length})`,
    ...plan.linkEdits.map((e) => `- ${rootRel(e.path)}`),
    "",
    `## skipped (${plan.skipped.length})`,
    ...plan.skipped.map((s) => `- ${s.path} — ${s.reason}`),
    "",
    `## conflicts (${plan.conflicts.length})`,
    ...plan.conflicts.map((c) => `- ${c}`),
    "",
  );
  return lines.join("\n");
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  try {
    const args = process.argv.slice(2).filter((arg) => arg !== "--");
    const at = args.indexOf("--root");
    if (
      at < 0 ||
      !args[at + 1] ||
      args.some((arg, index) => index !== at + 1 && !["--root", "--apply"].includes(arg))
    )
      throw new Error(
        "Usage: split-type-index-readme.mts --root /absolute/scope [--apply]",
      );
    const plan = planTypeIndexSplit(args[at + 1]!);
    process.stdout.write(formatSplitPlan(plan));
    if (plan.conflicts.length) throw new Error("conflicts detected; aborting");
    if (args.includes("--apply")) {
      await applyTypeIndexSplit(plan);
      process.stdout.write(
        `applied: ${plan.migrations.length} splits, ${plan.deletions.length} stub deletions, ${plan.linkEdits.length} link edits\n`,
      );
    } else process.stdout.write("dry-run only; pass --apply to write\n");
  } catch (error) {
    process.stderr.write(String(error) + "\n");
    process.exitCode = 1;
  }
}
