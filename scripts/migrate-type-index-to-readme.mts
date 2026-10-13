#!/usr/bin/env node
/**
 * Migrate system-one list entries from AGENTS.md to README.md (`project-entries-*`).
 *
 *  A. Type indexes `.harness/{memory,skills}/<type>/AGENTS.md` carrying
 *     `project-memory-type` / `project-memory-entries` markers.
 *  B. Organisation lists: directories whose AGENTS.md only lists Task/content leaves in
 *     `project-harness-local`, with no constraints, no `.harness` material and no
 *     descendants. Real system entries are never touched; ambiguous ones are skipped.
 *
 * Preview by default; `--apply` writes README, deletes the old AGENTS and retargets links.
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
  ".agents",
  ".superpowers",
  ".obsidian",
]);

const ENTRIES_HEADINGS = {
  local: "本层内容",
  descendants: "下层内容",
} as const;

export type MigrationKind = "type-index" | "org-list";

export interface Migration {
  kind: MigrationKind;
  from: string;
  to: string;
  before: EntryFile;
  source: string;
}
export interface Skipped {
  path: string;
  reason: string;
}
export interface LinkEdit {
  path: string;
  before: EntryFile;
  source: string;
}
export interface TypeIndexMigrationPlan {
  root: string;
  migrations: Migration[];
  skipped: Skipped[];
  linkEdits: LinkEdit[];
  conflicts: string[];
  snapshots: EntryFile[];
}

const TYPE_DIR = /(?:^|\/)\.harness\/(memory|skills)\/([^/]+)\/AGENTS\.md$/;
const PRIVATE_TYPE_DIR = /(?:^|\/)\.harness\/memory\/(?:users|private)\//;

const marker = (name: string, edge: "start" | "end") =>
  `<!-- ${name}:${edge} -->`;

function blockRange(
  source: string,
  name: string,
): { start: number; end: number; inner: string } | undefined {
  const start = source.indexOf(marker(name, "start"));
  const end = source.indexOf(marker(name, "end"));
  if (start < 0 && end < 0) return undefined;
  if (start < 0 || end < start)
    throw new Error(`malformed marker pair: ${name}`);
  return {
    start,
    end: end + marker(name, "end").length,
    inner: source.slice(start + marker(name, "start").length, end),
  };
}

export const isTypeIndexSource = (source: string): boolean =>
  source.includes(marker("project-memory-type", "start")) ||
  source.includes(marker("project-memory-entries", "start"));

/** Type index AGENTS.md → README.md source (type header kept, entries → project-entries-local). */
export function convertTypeIndex(source: string): string {
  const range = blockRange(source, "project-memory-entries");
  if (!range) return source;
  const body = range.inner.replace(/^\r?\n/, "").replace(/\s+$/, "");
  const next = [
    marker("project-entries-local", "start"),
    `## ${ENTRIES_HEADINGS.local}`,
    "",
    body || "- 暂无条目。",
    marker("project-entries-local", "end"),
  ].join("\n");
  return source.slice(0, range.start) + next + source.slice(range.end);
}

export interface OrgListFacts {
  entries: number;
  harnessEntries: number;
  constraints: boolean;
  descendants: boolean;
  harnessDir: boolean;
}

const LOCAL_NAMES = ["project-harness-local", "project-memory-local"];
const CONSTRAINT_NAMES = [
  "project-harness-constraints",
  "project-memory-important",
];
const DESCENDANT_NAMES = [
  "project-harness-descendants",
  "project-memory-children",
];

function firstBlock(source: string, names: string[]) {
  for (const name of names) {
    const range = blockRange(source, name);
    if (range) return { name, ...range };
  }
  return undefined;
}

const stripHeading = (inner: string) =>
  inner
    .split(/\r?\n/)
    .filter((line) => line.trim() && !/^#{1,6}\s/.test(line))
    .join("\n")
    .trim();

export function orgListFacts(source: string, harnessDir: boolean): OrgListFacts {
  const local = firstBlock(source, LOCAL_NAMES);
  const lines = (local?.inner ?? "")
    .split(/\r?\n/)
    .filter((line) => /^\s*[-*]\s+\[/.test(line));
  const constraints = firstBlock(source, CONSTRAINT_NAMES);
  const descendants = firstBlock(source, DESCENDANT_NAMES);
  return {
    entries: lines.length,
    harnessEntries: lines.filter((line) => {
      const target = /\]\((?:<([^>\n]+)>|([^)\s]+))/.exec(line);
      return /(?:^|\/)\.harness\//.test(target?.[1] ?? target?.[2] ?? "");
    }).length,
    constraints: !!constraints && !!stripHeading(constraints.inner),
    descendants: !!descendants && !!stripHeading(descendants.inner),
    harnessDir,
  };
}

/** `undefined` means: a pure organisation list that may move to README. */
export function orgListSkipReason(facts: OrgListFacts): string | undefined {
  if (!facts.entries) return "no list entries";
  if (facts.constraints) return "has non-empty constraints (real system entry)";
  if (facts.descendants) return "has descendants block (real system entry)";
  if (facts.harnessDir) return "owns a .harness directory (real system entry)";
  if (facts.harnessEntries)
    return `links ${facts.harnessEntries}/${facts.entries} .harness material (mixed; unsure)`;
}

const compactBlock = (inner: string): string =>
  inner
    .split(/\r?\n/)
    .filter((line, index) => index === 0 || line.trim())
    .join("\n")
    .replace(/^\r?\n+/, "")
    .replace(/\s+$/, "");

function swapBlock(
  source: string,
  names: string[],
  to: string,
  heading: string,
): string {
  const range = firstBlock(source, names);
  if (!range) return source;
  const body = compactBlock(
    range.inner.replace(/^\s*#{1,6}[^\n]*\n/, "").replace(/^\s*\n/, ""),
  );
  const next = [
    marker(to, "start"),
    `## ${heading}`,
    "",
    body,
    marker(to, "end"),
  ].join("\n");
  return source.slice(0, range.start) + next + source.slice(range.end);
}

/** Pure organisation-list AGENTS.md → README.md source. */
export function convertOrgList(source: string): string {
  let out = source;
  out = swapBlock(out, LOCAL_NAMES, "project-entries-local", ENTRIES_HEADINGS.local);
  for (const names of [CONSTRAINT_NAMES]) {
    const range = firstBlock(out, names);
    if (range && !stripHeading(range.inner))
      out = out.slice(0, range.start) + out.slice(range.end);
  }
  for (const outer of ["project-harness", "project-memory"])
    out = out
      .replace(new RegExp(`^<!-- ${outer}:(?:start|end) -->\\r?\\n?`, "gm"), "");
  return out.replace(/\n{3,}/g, "\n\n").replace(/\s*$/, "\n");
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

/** Retarget links that resolve to a moved `.../AGENTS.md`. Returns the same string if untouched. */
export function retargetLinks(
  file: string,
  source: string,
  moved: ReadonlyMap<string, string>,
): string {
  return source.replace(LINK, (whole, label: string, _all, angled, plain) => {
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
    const to = moved.get(target);
    if (!to) return whole;
    const swap = (text: string) =>
      text.slice(0, text.length - "AGENTS.md".length) + "README.md";
    const replaced = swap(pathPart) + raw.slice(pathPart.length);
    const shownLabel = label === decoded ? swap(label) : label;
    return angled
      ? `[${shownLabel}](<${replaced}>`
      : `[${shownLabel}](${replaced}`;
  });
}

export function planTypeIndexMigration(
  inputRoot: string,
  options: { scope?: "all" | "type-indexes" | "org-lists" } = {},
): TypeIndexMigrationPlan {
  if (!path.isAbsolute(inputRoot)) throw new Error("--root must be absolute");
  const root = checkPath(inputRoot);
  if (root.split(path.sep).includes("posts"))
    throw new Error("Protected posts cannot be migrated");
  const scope = options.scope ?? "all";
  const migrations: Migration[] = [];
  const skipped: Skipped[] = [];
  const conflicts: string[] = [];
  const snapshots: EntryFile[] = [];
  const markdown: string[] = [];

  for (const file of walk(root)) {
    if (!file.endsWith(".md")) continue;
    markdown.push(file);
    if (path.basename(file) !== "AGENTS.md") continue;
    const id = rel(root, file);
    const typeDir = TYPE_DIR.test(id);
    const before = readEntry(file)!;
    snapshots.push(before);
    let kind: MigrationKind | undefined;
    if (typeDir && isTypeIndexSource(before.source)) {
      if (PRIVATE_TYPE_DIR.test(id)) {
        skipped.push({ path: id, reason: "private user memory is not migrated" });
        continue;
      }
      if (scope === "org-lists") continue;
      kind = "type-index";
    } else if (!typeDir && scope !== "type-indexes") {
      const facts = orgListFacts(
        before.source,
        fs.existsSync(path.join(path.dirname(file), ".harness")),
      );
      if (!facts.entries && !firstBlock(before.source, LOCAL_NAMES)) continue;
      const reason = orgListSkipReason(facts);
      if (reason) {
        skipped.push({ path: id, reason });
        continue;
      }
      kind = "org-list";
    }
    if (!kind) continue;
    const to = path.join(path.dirname(file), "README.md");
    if (fs.existsSync(to)) {
      conflicts.push(`${rel(root, to)} already exists next to ${id}`);
      continue;
    }
    const source =
      kind === "type-index"
        ? convertTypeIndex(before.source)
        : convertOrgList(before.source);
    migrations.push({ kind, from: file, to, before, source });
  }

  const moved = new Map(migrations.map((m) => [m.from, m.to]));
  const linkEdits: LinkEdit[] = [];
  if (moved.size)
    for (const file of markdown) {
      const migration = migrations.find((m) => m.from === file);
      if (migration) {
        migration.source = retargetLinks(file, migration.source, moved);
        continue;
      }
      const entry = readEntry(file)!;
      const next = retargetLinks(file, entry.source, moved);
      if (next === entry.source) continue;
      snapshots.push(entry);
      linkEdits.push({ path: file, before: entry, source: next });
    }
  return { root, migrations, skipped, linkEdits, conflicts, snapshots };
}

function applyPlan(plan: TypeIndexMigrationPlan): void {
  if (plan.conflicts.length)
    throw new Error(`Conflicts:\n${plan.conflicts.join("\n")}`);
  for (const file of plan.snapshots) validateEntry(file);
  const changes: FileChange[] = [
    ...plan.migrations.flatMap((m): FileChange[] => [
      { path: m.to, source: m.source },
      { path: m.from, before: m.before },
    ]),
    ...plan.linkEdits.map((edit) => ({
      path: edit.path,
      before: edit.before,
      source: edit.source,
    })),
  ];
  if (changes.length) saveEntries(changes);
}

export async function applyTypeIndexMigration(
  plan: TypeIndexMigrationPlan,
): Promise<void> {
  const release = await acquireWriteLock(plan.root);
  try {
    applyPlan(plan);
  } finally {
    await release();
  }
}

export function formatPlan(plan: TypeIndexMigrationPlan): string {
  const lines: string[] = [];
  const section = (title: string, items: string[]) => {
    lines.push(`## ${title} (${items.length})`, ...items.map((i) => `- ${i}`), "");
  };
  const rootRel = (file: string) => rel(plan.root, file);
  section(
    "A. type indexes → README",
    plan.migrations
      .filter((m) => m.kind === "type-index")
      .map((m) => rootRel(m.from)),
  );
  section(
    "B. org lists → README (candidates)",
    plan.migrations
      .filter((m) => m.kind === "org-list")
      .map((m) => rootRel(m.from)),
  );
  section(
    "B. skipped (left alone)",
    plan.skipped.map((s) => `${s.path} — ${s.reason}`),
  );
  section(
    "link edits",
    plan.linkEdits.map((e) => rootRel(e.path)),
  );
  section("conflicts", plan.conflicts);
  return lines.join("\n");
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  try {
    const args = process.argv.slice(2).filter((arg) => arg !== "--");
    const at = args.indexOf("--root");
    const scopeAt = args.indexOf("--scope");
    const scope = scopeAt >= 0 ? args[scopeAt + 1] : "all";
    const valueIndexes = new Set([at + 1, scopeAt >= 0 ? scopeAt + 1 : -1]);
    if (
      at < 0 ||
      !args[at + 1] ||
      !["all", "type-indexes", "org-lists"].includes(scope!) ||
      args.some(
        (arg, index) =>
          !valueIndexes.has(index) &&
          !["--root", "--scope", "--apply"].includes(arg),
      )
    )
      throw new Error(
        "Usage: migrate-type-index-to-readme.mts --root /absolute/scope [--scope all|type-indexes|org-lists] [--apply]",
      );
    const plan = planTypeIndexMigration(args[at + 1]!, {
      scope: scope as "all" | "type-indexes" | "org-lists",
    });
    process.stdout.write(formatPlan(plan));
    if (plan.conflicts.length) throw new Error("conflicts detected; aborting");
    if (args.includes("--apply")) {
      await applyTypeIndexMigration(plan);
      process.stdout.write(
        `applied: ${plan.migrations.length} migrations, ${plan.linkEdits.length} link edits\n`,
      );
    } else process.stdout.write("dry-run only; pass --apply to write\n");
  } catch (error) {
    process.stderr.write(String(error) + "\n");
    process.exitCode = 1;
  }
}
