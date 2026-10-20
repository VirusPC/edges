#!/usr/bin/env node
/** Explicit tracked/public legacy conversion. Production node recognition stays directory-only. */
import * as fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import {
  AgentsNode,
  MemoryNode,
  NoteNode,
  TaskNode,
} from "../extensions/cli/src/domain/models/index.js";
import {
  indexContract,
  rewriteLinks,
} from "../extensions/cli/src/services/node/node-layout.js";
import {
  checkPath,
  readEntry,
  saveEntries,
  validateEntry,
  type EntryFile,
} from "../extensions/cli/src/services/node/node-files.js";

export interface DirectoryMove {
  from: string;
  to: string;
  reuseDirectory: boolean;
  kind: "memory" | "task" | "note" | "runlog";
}
export interface DirectoryMigrationPlan {
  root: string;
  moves: DirectoryMove[];
  updates: { path: string; source: string; before: EntryFile }[];
  snapshots: EntryFile[];
}
const journals = [
  ".recursive-layout-migration/journal.json",
  ".ownership-correction/public.json",
  ".ownership-correction/private.json",
];
function present(file: string): boolean {
  try {
    fs.lstatSync(file);
    return true;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw e;
  }
}
function excluded(file: string): boolean {
  return (
    /(?:^|\/)(?:\.git|\.obsidian|\.agents|node_modules|thirdparty|third-party|vendor|\.superpowers)(?:\/|$)/.test(
      file,
    ) ||
    /(?:^|\/)(?:knowledge\/)?posts(?:\/|$)/.test(file) ||
    /(?:^|\/)docs\/(?:adr|superpowers|discussions)(?:\/|$)/.test(file) ||
    /(?:^|\/)(?:\.memory|\.harness\/memory)\/(?:users|private)(?:\/|$)/.test(
      file,
    )
  );
}
function publicTracked(root: string): string[] {
  const names = execFileSync("git", ["ls-files", "-z", "--cached"], {
    cwd: root,
    encoding: "utf8",
  })
    .split("\0")
    .filter(Boolean)
    .filter((f) => !excluded(f));
  if (!names.length) return [];
  const ignored = spawnSync(
    "git",
    ["check-ignore", "--no-index", "-z", "--stdin"],
    { cwd: root, input: names.join("\0") + "\0", encoding: "utf8" },
  );
  if (ignored.status !== 0 && ignored.status !== 1)
    throw new Error(ignored.stderr || "Cannot verify public tracked scope");
  const skip = new Set(ignored.stdout.split("\0"));
  return names.filter((f) => !skip.has(f));
}
function hasEntryAncestor(file: string, root: string): boolean {
  let dir = path.dirname(file);
  while (dir.startsWith(root + path.sep)) {
    if (
      present(path.join(dir, "index.md")) ||
      present(path.join(dir, "SKILL.md"))
    )
      return true;
    dir = path.dirname(dir);
  }
  return false;
}
function refuseJournals(root: string): void {
  for (const name of journals)
    if (present(path.join(root, name)))
      throw new Error(
        `${path.join(root, name)}: legacy journal requires manual review before directory conversion; this tool never reads, resumes, archives or deletes it. Review public tracked content in a clean isolated worktree.`,
      );
}
export function planDirectoryMigration(
  rawRoot: string,
): DirectoryMigrationPlan {
  const root = fs.realpathSync(rawRoot);
  if (
    fs.realpathSync(
      execFileSync("git", ["rev-parse", "--show-toplevel"], {
        cwd: root,
        encoding: "utf8",
      }).trim(),
    ) !== root
  )
    throw new Error("--root must be the explicit Git worktree root");
  refuseJournals(root);
  const tracked = publicTracked(root),
    trackedSet = new Set(tracked);
  const contracts = new Map<string, ReturnType<typeof indexContract>>();
  const privateDirs: string[] = [];
  // Inspect only tracked public type headers; never open private descendants.
  for (const file of tracked.filter((f) =>
    /(?:^|\/)\.harness\/memory\/[^/]+\/AGENTS.md$/.test(f),
  )) {
    const abs = path.join(root, file);
    if (!present(abs)) continue;
    checkPath(abs);
    const contract = indexContract(
      new AgentsNode(abs).parse(fs.readFileSync(abs, "utf8")),
    );
    contracts.set(path.dirname(abs), contract);
    const source = fs.readFileSync(abs, "utf8");
    if (/(?:^|\n)gitignore:\s*true\s*(?:\n|$)/.test(source))
      privateDirs.push(path.dirname(abs));
  }
  const visible = (file: string) =>
    !privateDirs.some((d) => file === d || file.startsWith(d + path.sep));
  const moves: DirectoryMove[] = [],
    snapshots: EntryFile[] = [],
    updates: DirectoryMigrationPlan["updates"] = [];
  const snapshot = (file: string) => {
    const entry = readEntry(checkPath(file));
    if (!entry) throw new Error(`Missing tracked source: ${file}`);
    snapshots.push(entry);
    return entry;
  };
  for (const relative of tracked) {
    const from = path.join(root, relative),
      name = path.basename(from);
    if (
      !visible(from) ||
      !present(from) ||
      !name.endsWith(".md") ||
      name.startsWith(".") ||
      ["AGENTS.md", "SKILL.md", "index.md", "README.md"].includes(name)
    )
      continue;
    const contract = contracts.get(path.dirname(from));
    const kind =
      contract?.module === "memory" &&
      contract.name &&
      name.startsWith(contract.name + "_")
        ? "memory"
        : /(?:^|\/)tasks\/[^/]+\/(?:backlog|todo|in_progress|in_review|blocked|done|cancelled)\/[^/]+\.md$/.test(
              relative,
            )
          ? "task"
          : /(?:^|\/)(?:knowledge\/)?notes\/(?!.*(?:^|\/)\.harness\/).+\.md$/.test(
                relative,
              ) && !hasEntryAncestor(from, root)
            ? "note"
            : undefined;
    if (!kind) continue;
    const to = path.join(from.slice(0, -3), "index.md");
    checkPath(to);
    if (present(to) || present(path.join(path.dirname(to), "SKILL.md")))
      throw new Error(`Target collision: ${to}`);
    const entry = snapshot(from);
    const Model =
      kind === "memory" ? MemoryNode : kind === "task" ? TaskNode : NoteNode;
    new Model(from).parse(entry.source).validate();
    moves.push({ from, to, reuseDirectory: present(path.dirname(to)), kind });
    if (kind === "task") {
      const log = path.join(
        path.dirname(from),
        "." + name.slice(0, -3) + ".log.md",
      );
      if (trackedSet.has(path.relative(root, log)) && present(log)) {
        const dest = path.join(path.dirname(to), path.basename(log));
        checkPath(dest);
        if (present(dest)) throw new Error(`Target collision: ${dest}`);
        snapshot(log);
        moves.push({
          from: log,
          to: dest,
          reuseDirectory: present(path.dirname(to)),
          kind: "runlog",
        });
      }
    }
  }
  const mapping = new Map(moves.map((m) => [m.from, m.to]));
  const relocate = (file: string) => mapping.get(file) ?? file;
  for (const move of moves) {
    const entry = snapshots.find((e) => e.path === move.from)!;
    updates.push({
      path: move.to,
      source: rewriteLinks(entry.source, move.from, move.to, relocate),
      before: entry,
    });
  }
  // Canonical public nodes are managed documents; arbitrary README/ADR prose remains untouched.
  for (const relative of tracked) {
    const file = path.join(root, relative);
    if (
      !visible(file) ||
      !present(file) ||
      !["AGENTS.md", "SKILL.md", "index.md"].includes(path.basename(file))
    )
      continue;
    const before = snapshot(file),
      source = rewriteLinks(before.source, file, file, relocate);
    if (source !== before.source) updates.push({ path: file, source, before });
  }
  return { root, moves, updates, snapshots };
}
export function applyDirectoryMigration(plan: DirectoryMigrationPlan): void {
  refuseJournals(plan.root);
  for (const snapshot of plan.snapshots) validateEntry(snapshot);
  const fresh = planDirectoryMigration(plan.root);
  if (
    JSON.stringify(fresh.moves) !== JSON.stringify(plan.moves) ||
    JSON.stringify(fresh.updates.map((u) => [u.path, u.source])) !==
      JSON.stringify(plan.updates.map((u) => [u.path, u.source]))
  )
    throw new Error(
      "Stale migration plan: tracked public scope changed; preview again",
    );
  // Check every target before creating any destination. Existing resource directories are reused.
  for (const move of plan.moves) {
    checkPath(move.to);
    if (present(move.to)) throw new Error(`Target collision: ${move.to}`);
  }
  const createdDirs: string[] = [];
  try {
    for (const move of plan.moves) {
      const dir = path.dirname(move.to);
      if (!present(dir)) {
        fs.mkdirSync(dir);
        createdDirs.push(dir);
      }
    }
    saveEntries(
      plan.updates.map((u) => ({
        path: u.path,
        source: u.source,
        createMode: u.before.mode,
        before: u.path === u.before.path ? u.before : undefined,
      })),
    );
  } catch (error) {
    for (const dir of createdDirs.reverse()) {
      try {
        fs.rmdirSync(dir);
      } catch {
        /* Leave recovery content intact. */
      }
    }
    throw error;
  }
  // Keep originals until every destination and registered reference is saved.
  try {
    for (const move of plan.moves) {
      validateEntry(plan.snapshots.find((s) => s.path === move.from)!);
      fs.unlinkSync(move.from);
    }
  } catch (error) {
    throw new Error(
      `Directory migration cleanup incomplete; preserve original/destination files and review ${plan.root}. ${String(error)}`,
    );
  }
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  try {
    const args = process.argv.slice(2);
    let root: string | undefined;
    let apply = false;
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "--root") root = args[++i];
      else if (args[i] === "--apply") apply = true;
      else if (args[i] !== "--dry-run")
        throw new Error(`Unknown option: ${args[i]}`);
    }
    if (apply && args.includes("--dry-run"))
      throw new Error("--apply and --dry-run conflict");
    if (!root)
      throw new Error(
        "Usage: pnpm migrate:directory-nodes --root <worktree> [--dry-run | --apply]",
      );
    const plan = planDirectoryMigration(root);
    if (apply) applyDirectoryMigration(plan);
    console.log(
      JSON.stringify(
        {
          mode: apply ? "applied" : "dry-run",
          root: plan.root,
          moves: plan.moves,
          updatedReferences: plan.updates
            .filter((u) => u.path === u.before.path)
            .map((u) => u.path),
        },
        null,
        2,
      ),
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
