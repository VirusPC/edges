import { execFile } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, readdirSync, realpathSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { existsSync as fileExists } from "node:fs";
import { AgentsNode } from "../../domain/models/index.js";
import { ENTRY_NAMES } from "../../domain/config/layout.js";
import {
  ComposeReadmeNode,
  COMPOSE_INDEX_DESCRIPTION,
  COMPOSE_INDEX_NAME,
  composeReadmePath,
  composeReadmeSeed,
  hrefForScopeCheckout,
  type ComposeCheckout,
  type ComposeEntry,
} from "../../domain/models/compose/compose-readme-node.js";
import { openNodeSession } from "../node/scope-session.js";
import { ensureScopeReadme, ensureScopeReadmePointer, linkScopeReadme } from "../init/service.js";
import { composeEntryWarnings, legacyPathWarning } from "./health.js";
import type { NodeService } from "../node/node-service.js";

export { doctorCompose } from "./doctor.js";
export type { ComposeDoctorChange, ComposeDoctorResult } from "./doctor.js";

const execFileAsync = promisify(execFile);

/**
 * Per-entry result of `compose update`. `initialized`: the checkout was missing and is
 * now there. `present`: already checked out, nothing to do. `updated`: `--remote` moved it
 * to the remote tip. `failed`: this entry's own git step failed; the batch keeps going.
 */
export type ComposeGitAction = "initialized" | "present" | "updated" | "failed";

export interface ComposeGitReport {
  name: string;
  directory: string;
  remote?: string;
  action: ComposeGitAction;
  /** Only set when `action` is `failed`. */
  error?: string;
}

export interface ComposeAddInput {
  name: string;
  /**
   * Checkout directory relative to the scope directory.
   * Omitted directories use `.edges/compose/<name>`. Absolute and `~` paths are rejected.
   * The href written in `compose/README.md` is relative to `.edges/compose/`.
   */
  directory?: string;
  description?: string;
  remote?: string;
}

export interface ComposeAddResult {
  entry: ComposeEntry;
  /** `added`: ran `git submodule add`. `existing`: the submodule was already there. */
  submodule?: "added" | "existing";
  /** `warning: ...` lines for stderr. */
  warnings: string[];
}

export interface ComposeGitRun {
  reports: ComposeGitReport[];
  /** `warning: ...` lines for stderr that are not per-entry failures (e.g. legacy paths). */
  warnings: string[];
}

function gitEnv(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  return { ...process.env, ...env, GIT_TERMINAL_PROMPT: "0" };
}

async function git(args: string[], env: NodeJS.ProcessEnv = process.env): Promise<string> {
  try {
    const { stdout } = await execFileAsync("git", args, {
      env: gitEnv(env),
      maxBuffer: 10 * 1024 * 1024,
    });
    return stdout;
  } catch (error) {
    const err = error as { stderr?: string; stdout?: string; message?: string };
    throw new Error(
      (err.stderr || err.stdout || err.message || "git failed").trim(),
    );
  }
}

async function gitTry(args: string[], env: NodeJS.ProcessEnv): Promise<string | undefined> {
  try {
    return (await git(args, env)).trim();
  } catch {
    return undefined;
  }
}

async function requireScope(env: NodeJS.ProcessEnv): Promise<{ scope: string; service: NodeService }> {
  const session = openNodeSession(env);
  const file = path.join(session.scope, ENTRY_NAMES.internal);
  if (!fileExists(file)) throw new Error(`Missing scope entry: ${file}. Add AGENTS.md.`);
  const node = await session.service.get(file, AgentsNode);
  if (!node) throw new Error(`Missing scope entry: ${file}. Add AGENTS.md.`);
  return { scope: session.scope, service: session.service };
}

/** Create `compose/README.md` and its link from `.edges/README.md` when either is missing. */
export async function ensureComposeEntry(scope: string, service: NodeService): Promise<ComposeReadmeNode> {
  const file = composeReadmePath(scope);
  await ensureScopeReadme(scope, service);
  await ensureScopeReadmePointer(scope, service);
  if (!fileExists(file)) {
    await service.create(new ComposeReadmeNode(file), {
      name: COMPOSE_INDEX_NAME,
      description: COMPOSE_INDEX_DESCRIPTION,
      body: composeReadmeSeed(),
    });
  }
  await linkScopeReadme(scope, {
    id: file,
    name: COMPOSE_INDEX_NAME,
    description: COMPOSE_INDEX_DESCRIPTION,
  }, service);
  const node = await service.get(file, ComposeReadmeNode);
  if (!node) throw new Error(`Missing compose entry: ${file}`);
  return node;
}

async function loadCompose(env: NodeJS.ProcessEnv): Promise<{
  service: NodeService;
  node: ComposeReadmeNode;
  scope: string;
}> {
  const { scope, service } = await requireScope(env);
  const node = await ensureComposeEntry(scope, service);
  return { service, node, scope };
}

function checkouts(node: ComposeReadmeNode, name?: string): ComposeCheckout[] {
  if (name === undefined) return node.entries().map((entry) => node.checkout(entry.name));
  return [node.checkout(name)];
}

function sameRemote(left: string, right: string): boolean {
  const norm = (value: string) =>
    value.trim().replace(/\/+$/, "").replace(/\.git$/i, "");
  return norm(left) === norm(right);
}

/** realpath of the nearest existing ancestor, with the missing tail re-appended. */
function realish(target: string): string {
  const missing: string[] = [];
  let current = path.resolve(target);
  while (!existsSync(current)) {
    const parent = path.dirname(current);
    if (parent === current) break;
    missing.unshift(path.basename(current));
    current = parent;
  }
  try {
    current = realpathSync(current);
  } catch {
    /* keep the resolved path */
  }
  return path.join(current, ...missing);
}

/**
 * Where an entry lives relative to the owner repo. `submodule`: inside the owner's
 * git work tree, managed with `git submodule`. `standalone`: outside any owner repo
 * (legacy `~/...` / absolute entries, or an owner that is not in git), managed with
 * plain `git clone` / `git pull` as before.
 */
type Placement =
  | { kind: "submodule"; top: string; rel: string }
  | { kind: "standalone" };

async function placement(
  ownerDir: string,
  directory: string,
  env: NodeJS.ProcessEnv,
): Promise<Placement> {
  if (!existsSync(ownerDir)) return { kind: "standalone" };
  const top = await gitTry(["-C", ownerDir, "rev-parse", "--show-toplevel"], env);
  if (!top) return { kind: "standalone" };
  const root = realish(top);
  const rel = path.relative(root, realish(directory));
  if (!rel || rel.startsWith("..") || path.isAbsolute(rel)) return { kind: "standalone" };
  return { kind: "submodule", top: root, rel: rel.split(path.sep).join("/") };
}

interface SubmoduleInfo {
  name: string;
  url?: string;
}

/** The `.gitmodules` record whose path is `rel`, if any. */
async function submoduleAt(
  top: string,
  rel: string,
  env: NodeJS.ProcessEnv,
): Promise<SubmoduleInfo | undefined> {
  if (!existsSync(path.join(top, ".gitmodules"))) return undefined;
  const listing = await gitTry(
    ["-C", top, "config", "-f", ".gitmodules", "--get-regexp", "^submodule\\..*\\.path$"],
    env,
  );
  if (!listing) return undefined;
  for (const line of listing.split("\n")) {
    const match = /^submodule\.(.+)\.path\s+(.+)$/.exec(line.trim());
    if (!match || match[1] === undefined || match[2] === undefined) continue;
    if (path.posix.normalize(match[2]) !== rel) continue;
    const name = match[1];
    const url = await gitTry(["-C", top, "config", "-f", ".gitmodules", "--get", `submodule.${name}.url`], env);
    return { name, ...(url ? { url } : {}) };
  }
  return undefined;
}

/** True when `directory` is the top of its own git work tree (an initialized checkout). */
async function isOwnCheckout(directory: string, env: NodeJS.ProcessEnv): Promise<boolean> {
  if (!existsSync(directory)) return false;
  try {
    if (!lstatSync(directory).isDirectory()) return false;
  } catch {
    return false;
  }
  const top = await gitTry(["-C", directory, "rev-parse", "--show-toplevel"], env);
  return top !== undefined && realish(top) === realish(directory);
}

function isEmptyDirectory(directory: string): boolean {
  try {
    return readdirSync(directory).length === 0;
  } catch {
    return false;
  }
}

async function isGitCheckout(directory: string, env: NodeJS.ProcessEnv): Promise<boolean> {
  if (!existsSync(directory)) return false;
  try {
    if (!lstatSync(directory).isDirectory()) return false;
    return (await git(["-C", directory, "rev-parse", "--is-inside-work-tree"], env)).trim() === "true";
  } catch {
    return false;
  }
}

async function addSubmodule(
  at: { top: string; rel: string },
  remote: string,
  env: NodeJS.ProcessEnv,
): Promise<void> {
  await git(["-C", at.top, "submodule", "add", "--", remote, at.rel], env);
}

/**
 * Run one git step per entry. A failing entry becomes a `failed` report and the
 * loop moves on. Scope and `--name` lookup errors happen before this and still throw.
 */
async function eachCheckout(
  entries: ComposeCheckout[],
  step: (entry: ComposeCheckout) => Promise<Exclude<ComposeGitAction, "failed">>,
): Promise<ComposeGitRun> {
  const reports: ComposeGitReport[] = [];
  const warnings: string[] = [];
  for (const entry of entries) {
    const base = {
      name: entry.name,
      directory: entry.directory,
      ...(entry.remote === undefined ? {} : { remote: entry.remote }),
    };
    const legacy = legacyPathWarning(entry);
    if (legacy) warnings.push(legacy);
    try {
      reports.push({ ...base, action: await step(entry) });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      reports.push({ ...base, action: "failed", error: message });
    }
  }
  return { reports, warnings };
}

export interface ComposeListEntry extends ComposeEntry {
  /** The entry directory exists and is not empty (e.g. an initialized git submodule). */
  initialized: boolean;
}

export async function listCompose(
  env: NodeJS.ProcessEnv,
): Promise<{ entries: ComposeListEntry[]; warnings: string[] }> {
  const { node } = await loadCompose(env);
  const entries = node.entries();
  return {
    entries: entries.map((entry) => ({
      ...entry,
      initialized: existsSync(entry.directory) && !isEmptyDirectory(entry.directory),
    })),
    warnings: composeEntryWarnings(entries),
  };
}

export async function addCompose(
  env: NodeJS.ProcessEnv,
  input: ComposeAddInput,
): Promise<ComposeAddResult> {
  const loaded = await requireScope(env);
  const name = input.name.trim();
  if (input.directory !== undefined) hrefForScopeCheckout(composeReadmePath(loaded.scope), loaded.scope, input.directory);
  const { service } = loaded;
  const node = await ensureComposeEntry(loaded.scope, service);
  // Validate (name, relative path, duplicates) before touching git.
  node.addChild({
    name,
    ...(input.directory === undefined
      ? {}
      : { href: hrefForScopeCheckout(node.path, loaded.scope, input.directory) }),
    description: input.description,
    remote: input.remote,
  });
  const checkout = node.checkout(name);
  const warnings: string[] = [];
  let submodule: ComposeAddResult["submodule"];
  const remote = checkout.remote;
  if (remote) {
    const at = await placement(loaded.scope, checkout.directory, env);
    if (at.kind === "submodule") {
      const existing = await submoduleAt(at.top, at.rel, env);
      if (existing) {
        if (existing.url && !sameRemote(existing.url, remote))
          throw new Error(
            `Submodule at ${at.rel} already points at ${existing.url}, not ${remote}`,
          );
        submodule = "existing";
      } else {
        await addSubmodule(at, remote, env);
        submodule = "added";
      }
    } else {
      warnings.push(
        `warning: compose entry ${name} is outside the owner's git repo; skipped git submodule add. ` +
          `edges compose update will use a plain git clone.\n`,
      );
    }
  }
  await service.update(node, {});
  const saved = await service.get(node.path, ComposeReadmeNode);
  const entry = saved?.entries().find((item) => item.name === name);
  if (!entry) throw new Error(`Compose entry was not saved: ${name}`);
  return { entry, ...(submodule ? { submodule } : {}), warnings };
}

/** Legacy / out-of-repo entry: plain `git clone` when missing, `git pull` for `--remote`. */
async function updateStandalone(
  entry: ComposeCheckout,
  remote: boolean,
  env: NodeJS.ProcessEnv,
): Promise<Exclude<ComposeGitAction, "failed">> {
  if (await isGitCheckout(entry.directory, env)) {
    if (entry.remote) {
      const origin = await gitTry(["-C", entry.directory, "remote", "get-url", "origin"], env);
      if (!origin) throw new Error(`Compose checkout has no origin: ${entry.directory}`);
      if (!sameRemote(origin, entry.remote))
        throw new Error(
          `Compose checkout origin does not match the registered remote: ${entry.name}`,
        );
    }
    if (!remote) return "present";
    await git(["-C", entry.directory, "pull"], env);
    return "updated";
  }
  if (!entry.remote)
    throw new Error(`Compose entry has no git remote: ${entry.name}`);
  if (existsSync(entry.directory) && !isEmptyDirectory(entry.directory))
    throw new Error(
      `Compose path exists and is not a git checkout: ${entry.directory}`,
    );
  mkdirSync(path.dirname(entry.directory), { recursive: true });
  await git(["clone", entry.remote, entry.directory], env);
  return "initialized";
}

/**
 * `edges compose update [--remote] [--name]`. In-repo entries:
 * `git submodule update --init [--remote [--merge]] -- <path>`, never `--recursive`, so a
 * composed repo's own Compose entries stay uninitialized. `--merge` is added with
 * `--remote` when the submodule is on a branch, so that branch is not detached.
 */
export async function updateCompose(
  env: NodeJS.ProcessEnv,
  options: { name?: string; remote?: boolean } = {},
): Promise<ComposeGitRun> {
  const { node, scope } = await loadCompose(env);
  const ownerDir = scope;
  const remote = options.remote === true;
  return eachCheckout(checkouts(node, options.name), async (entry) => {
    const at = await placement(ownerDir, entry.directory, env);
    if (at.kind === "standalone") return updateStandalone(entry, remote, env);
    const info = await submoduleAt(at.top, at.rel, env);
    if (!info) {
      if (!entry.remote)
        throw new Error(`Compose entry has no git remote: ${entry.name}`);
      if (existsSync(entry.directory) && !isEmptyDirectory(entry.directory) && !(await isOwnCheckout(entry.directory, env)))
        throw new Error(`Compose path exists and is not a git checkout: ${entry.directory}`);
      await addSubmodule(at, entry.remote, env);
      return "initialized";
    }
    if (entry.remote && info.url && !sameRemote(info.url, entry.remote))
      throw new Error(
        `Compose submodule URL does not match the registered remote: ${entry.name} (${info.url})`,
      );
    const initialized = await isOwnCheckout(entry.directory, env);
    const onBranch =
      remote &&
      initialized &&
      (await gitTry(["-C", entry.directory, "symbolic-ref", "-q", "HEAD"], env)) !== undefined;
    await git(
      [
        "-C", at.top, "submodule", "update", "--init",
        ...(remote ? ["--remote"] : []),
        ...(onBranch ? ["--merge"] : []),
        "--", at.rel,
      ],
      env,
    );
    if (!initialized) return "initialized";
    return remote ? "updated" : "present";
  });
}
