#!/usr/bin/env node
/** Edges instance layout relocation; preview by default. Historical manifests remain historical. */
import * as fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { rewriteLinks } from "../extensions/cli/src/services/node-layout.js";

const relocations = [
  ["knowledge/archive", "archive"],
  ["knowledge/edges", "edges"],
  ["knowledge/notes", "notes"],
  ["knowledge/posts", "posts"],
  ["knowledge/resources", "resources"],
  ["apps", "extensions/apps"],
] as const;
interface Move {
  from: string;
  to: string;
}
interface Snapshot {
  from: string;
  to: string;
  before: Buffer;
  mode: number;
}
interface Edit extends Snapshot {
  after: Buffer;
}
export interface TopLevelLayoutPlan {
  root: string;
  moves: Move[];
  edits: Edit[];
  snapshots: Snapshot[];
}
const exists = (file: string): boolean => {
  try {
    fs.lstatSync(file);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
};
function noSymlink(file: string, root: string): void {
  for (let at = file; at !== root; at = path.dirname(at)) {
    if (!at.startsWith(root + path.sep))
      throw new Error(`Outside root: ${file}`);
    if (exists(at) && fs.lstatSync(at).isSymbolicLink())
      throw new Error(`Symlink: ${at}`);
  }
}
function relocated(file: string): string {
  for (const [from, to] of relocations)
    if (file === from || file.startsWith(from + "/"))
      return to + file.slice(from.length);
  return file;
}
function privatePath(file: string): boolean {
  return /(?:^|\/)(?:\.memory|\.harness\/memory)\/(?:users|private)(?:\/|$)/.test(
    file,
  );
}
function activeDocumentation(file: string): boolean {
  if (/(?:^|\/)\.harness\/memory\//.test(file)) return false;
  if (file.endsWith("/AGENTS.md") || file === "AGENTS.md") return true;
  if (file.includes("/.harness/") || file.startsWith(".harness/")) return false;
  if (/(?:^|\/)CHANGELOG\.md$/.test(file) || file.startsWith("archive/"))
    return false;
  return (
    ["README.md", "CONTEXT.md"].includes(file) ||
    /^(?:extensions|shared-extensions)\/.*\.md$/.test(file) ||
    /^(?:notes|edges|resources)\/(?:.*\/)?README\.md$/.test(file)
  );
}
function currentPathText(source: string): string {
  return source.replace(
    /knowledge\/(archive|edges|notes|posts|resources)(?=\/|[\s`'"<>)\]，。]|$)/g,
    "$1",
  );
}
function updatedText(
  source: string,
  oldFile: string,
  newFile: string,
  root: string,
): string {
  const before = path.join(root, oldFile),
    after = path.join(root, newFile);
  if (oldFile.endsWith(".md")) {
    // Express new relative destinations against the old origin: unchanged hrefs stay byte-for-byte intact.
    source = rewriteLinks(source, before, before, (target) => {
      if (target !== root && !target.startsWith(root + path.sep)) return target;
      const targetAfter = path.join(
        root,
        relocated(path.relative(root, target)),
      );
      return path.resolve(
        path.dirname(before),
        path.relative(path.dirname(after), targetAfter),
      );
    });
    if (activeDocumentation(newFile)) source = currentPathText(source);
  }
  if (oldFile === ".gitignore" || oldFile === "pnpm-workspace.yaml")
    source = currentPathText(source).replace(
      /(?<![\w/.-])apps\//g,
      "extensions/apps/",
    );
  if (oldFile === "pnpm-lock.yaml")
    // Relocate this repository's app importers and CLI -> app workspace link;
    // keep package versions, integrity records and dependency snapshots intact.
    source = source
      .replace(/^  apps\//gm, "  extensions/apps/")
      .replace(/(version: link:)\.\.\/\.\.\/apps\//g, "$1../apps/");
  if (
    oldFile === "extensions/cli/src/services/note/git/ingest.ts" ||
    /^extensions\/(?:cli\/test\/note\/|mcp-servers\/new-note\/test\/)/.test(
      oldFile,
    ) ||
    [
      "extensions/cli/test/services/directory-cli.test.ts",
      "extensions/cli/test/services/production-nodes.test.ts",
    ].includes(oldFile)
  )
    source = source
      .replaceAll("knowledge/notes", "notes")
      .replaceAll("knowledge\\/notes", "notes");
  if (newFile === "extensions/apps/tasks-review-app/vite.config.ts")
    source = source.replace("../../extensions/cli/", "../../cli/");
  if (newFile === "extensions/apps/tasks-review-app/src/statuses.ts")
    source = source.replace("../../../extensions/cli/", "../../../cli/");
  return source;
}
export function planTopLevelLayout(rawRoot: string): TopLevelLayoutPlan {
  const root = fs.realpathSync(rawRoot);
  const gitRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], {
    cwd: root,
    encoding: "utf8",
  }).trim();
  if (fs.realpathSync(gitRoot) !== root)
    throw new Error("Select the explicit Git worktree root");
  const moves: Move[] = [];
  for (const [from, to] of relocations) {
    const source = path.join(root, from),
      destination = path.join(root, to);
    if (!exists(source)) continue;
    noSymlink(source, root);
    noSymlink(destination, root);
    if (!fs.statSync(source).isDirectory())
      throw new Error(`Not a directory: ${source}`);
    if (exists(destination))
      throw new Error(`Destination collision: ${destination}`);
    moves.push({ from: source, to: destination });
  }
  if (exists(path.join(root, "knowledge"))) {
    noSymlink(path.join(root, "knowledge"), root);
    const unknown = fs
      .readdirSync(path.join(root, "knowledge"))
      .filter(
        (name) => !relocations.some(([from]) => from === `knowledge/${name}`),
      );
    if (unknown.length)
      throw new Error(`Unplanned knowledge entries: ${unknown.join(", ")}`);
  }
  const tracked = execFileSync("git", ["ls-files", "-z"], {
    cwd: root,
    encoding: "utf8",
  })
    .split("\0")
    .filter(Boolean);
  const ignored = spawnSync(
    "git",
    ["check-ignore", "--no-index", "-z", "--stdin"],
    { cwd: root, input: tracked.join("\0") + "\0", encoding: "utf8" },
  );
  if (ignored.status !== 0 && ignored.status !== 1)
    throw new Error(ignored.stderr || "Cannot inspect ignore rules");
  const ignoredNames = new Set(ignored.stdout.split("\0"));
  const edits: Edit[] = [],
    snapshots: Snapshot[] = [];
  const seen = new Set<string>();
  for (const original of tracked) {
    if (
      ignoredNames.has(original) ||
      privatePath(original) ||
      original === ".obsidian/workspace.json" ||
      /(?:^|\/)(?:\.agents|\.claude|\.superpowers)\//.test(original)
    )
      continue;
    const mapped = relocated(original);
    // Also works before staging the rename: Git may still list the old paths.
    const current = exists(path.join(root, original)) ? original : mapped;
    const from = path.join(root, current),
      to = path.join(root, relocated(current));
    if (seen.has(from) || !exists(from)) continue;
    seen.add(from);
    if (!fs.lstatSync(from).isFile()) continue;
    noSymlink(from, root);
    if (
      !/\.(?:md|ts|tsx|json|ya?ml)$/.test(current) &&
      current !== ".gitignore"
    )
      continue;
    const before = fs.readFileSync(from),
      mode = fs.statSync(from).mode & 0o777;
    if (before.includes(0)) continue;
    const snapshot = { from, to, before, mode };
    snapshots.push(snapshot);
    if (/^(?:knowledge\/)?posts\//.test(current)) continue; // Explicitly authorized relocation only, never rewrite posts.
    const after = Buffer.from(
      updatedText(
        before.toString("utf8"),
        current,
        path.relative(root, to),
        root,
      ),
    );
    if (!before.equals(after)) edits.push({ ...snapshot, after });
  }
  return { root, moves, edits, snapshots };
}
export function applyTopLevelLayout(plan: TopLevelLayoutPlan): void {
  for (const file of plan.snapshots) {
    noSymlink(file.from, plan.root);
    if (
      !exists(file.from) ||
      !fs.readFileSync(file.from).equals(file.before) ||
      (fs.statSync(file.from).mode & 0o777) !== file.mode
    )
      throw new Error(`Stale source changed: ${file.from}`);
  }
  for (const move of plan.moves) {
    noSymlink(move.from, plan.root);
    noSymlink(move.to, plan.root);
    if (!exists(move.from) || exists(move.to))
      throw new Error(
        `Move source changed or destination collision: ${move.to}`,
      );
  }
  const moved: Move[] = [],
    written: Edit[] = [];
  try {
    for (const move of plan.moves) {
      fs.mkdirSync(path.dirname(move.to), { recursive: true });
      fs.renameSync(move.from, move.to);
      moved.push(move);
    }
    for (const edit of plan.edits) {
      written.push(edit);
      fs.writeFileSync(edit.to, edit.after);
      fs.chmodSync(edit.to, edit.mode);
    }
  } catch (error) {
    const failures: string[] = [];
    for (const edit of written.reverse())
      try {
        fs.writeFileSync(edit.to, edit.before);
        fs.chmodSync(edit.to, edit.mode);
      } catch {
        failures.push(edit.to);
      }
    for (const move of moved.reverse())
      try {
        fs.renameSync(move.to, move.from);
      } catch {
        failures.push(move.from);
      }
    throw new Error(
      `Layout migration failed${failures.length ? `; recovery incomplete: ${failures.join(", ")}` : "; source files restored"}`,
      { cause: error },
    );
  }
  const knowledge = path.join(plan.root, "knowledge");
  if (exists(knowledge) && fs.readdirSync(knowledge).length === 0)
    fs.rmdirSync(knowledge);
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  const args = process.argv.slice(2);
  const index = args.indexOf("--root");
  if (index === -1 || !args[index + 1])
    throw new Error("Usage: --root <worktree> [--apply]");
  const plan = planTopLevelLayout(args[index + 1]!);
  console.log(
    JSON.stringify(
      {
        root: plan.root,
        moves: plan.moves.map((move) => ({
          from: path.relative(plan.root, move.from),
          to: path.relative(plan.root, move.to),
        })),
        edits: plan.edits.map((edit) => path.relative(plan.root, edit.to)),
      },
      null,
      2,
    ),
  );
  if (args.includes("--apply")) applyTopLevelLayout(plan);
}
