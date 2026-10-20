import { execFile } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, readdirSync, realpathSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { AgentsNode } from "../../domain/models/index.js";
import { ENTRY_NAMES } from "../../domain/config/layout.js";
import type { ComposeCheckout, ComposeEntry } from "../../domain/models/compose/compose-node.js";
import { openNodeSession } from "../node/scope-session.js";
import { composeEntryWarnings, legacyPathWarning } from "./health.js";
import type { NodeService } from "../node/node-service.js";

const execFileAsync = promisify(execFile);

/** `failed` marks an entry whose own git step failed; the batch keeps going. */
export type ComposeGitAction = "cloned" | "present" | "pulled" | "pushed" | "failed";

export interface ComposeGitReport {
  name: string;
  directory: string;
  remote?: string;
  action: ComposeGitAction;
  /** Only set when `action` is `failed`. */
  error?: string;
}

export interface ComposeRegisterInput {
  name: string;
  /**
   * Checkout directory relative to the owner AGENTS.md directory.
   * Omitted directories use `.harness/compose/<name>`. Absolute and `~` paths are rejected.
   */
  directory?: string;
  description?: string;
  remote?: string;
}

export interface ComposeRegisterResult {
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

async function loadScope(env: NodeJS.ProcessEnv): Promise<{
  service: NodeService;
  node: AgentsNode;
}> {
  const { scope, service } = openNodeSession(env);
  const file = path.join(scope, ENTRY_NAMES.internal);
  const node = await service.get(file, AgentsNode);
  if (!node) throw new Error(`Missing scope entry: ${file}. Add AGENTS.md.`);
  return { service, node };
}

function checkouts(node: AgentsNode, name?: string): ComposeCheckout[] {
  const compose = node.composeNode();
  if (name === undefined) return compose.entries().map((entry) => compose.checkout(entry.name));
  return [compose.checkout(name)];
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
 * plain `git clone` / `git pull` / `git push` as before.
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

async function requireCheckout(entry: ComposeCheckout, env: NodeJS.ProcessEnv): Promise<void> {
  if (!(await isGitCheckout(entry.directory, env)))
    throw new Error(`Compose checkout is missing: ${entry.name}`);
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

export async function listCompose(
  env: NodeJS.ProcessEnv,
): Promise<{ entries: ComposeEntry[]; warnings: string[] }> {
  const { node } = await loadScope(env);
  const entries = node.composeNode().entries();
  return { entries, warnings: composeEntryWarnings(entries) };
}

export async function registerCompose(
  env: NodeJS.ProcessEnv,
  input: ComposeRegisterInput,
): Promise<ComposeRegisterResult> {
  const { service, node } = await loadScope(env);
  const name = input.name.trim();
  const compose = node.composeNode();
  // Validate (name, relative path, duplicates) before touching git.
  compose.addChild({
    name,
    ...(input.directory === undefined ? {} : { directory: input.directory }),
    description: input.description,
    remote: input.remote,
  });
  const checkout = compose.checkout(name);
  const warnings: string[] = [];
  let submodule: ComposeRegisterResult["submodule"];
  const remote = checkout.remote;
  if (remote) {
    const at = await placement(path.dirname(node.path), checkout.directory, env);
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
          `edges compose clone will use a plain git clone.\n`,
      );
    }
  }
  await service.update(node, {});
  const saved = await service.get(node.path, AgentsNode);
  const entry = saved?.composeNode().entries().find((item) => item.name === name);
  if (!entry) throw new Error(`Compose entry was not saved: ${name}`);
  return { entry, ...(submodule ? { submodule } : {}), warnings };
}

export async function unregisterCompose(
  env: NodeJS.ProcessEnv,
  name: string,
): Promise<ComposeEntry> {
  const { service, node } = await loadScope(env);
  const trimmed = name.trim();
  const entry = node.composeNode().entries().find((item) => item.name === trimmed);
  if (!entry) throw new Error(`Compose entry not found: ${trimmed || name}`);
  node.composeNode().removeChild(entry.id);
  await service.update(node, {});
  return entry;
}

async function cloneStandalone(entry: ComposeCheckout, env: NodeJS.ProcessEnv): Promise<"cloned" | "present"> {
  if (!entry.remote)
    throw new Error(`Compose entry has no git remote: ${entry.name}`);
  if (await isGitCheckout(entry.directory, env)) {
    let origin = "";
    try {
      origin = (await git(["-C", entry.directory, "remote", "get-url", "origin"], env)).trim();
    } catch {
      throw new Error(`Compose checkout has no origin: ${entry.directory}`);
    }
    if (!sameRemote(origin, entry.remote))
      throw new Error(
        `Compose checkout origin does not match the registered remote: ${entry.name}`,
      );
    return "present";
  }
  if (existsSync(entry.directory))
    throw new Error(
      `Compose path exists and is not a git checkout: ${entry.directory}`,
    );
  mkdirSync(path.dirname(entry.directory), { recursive: true });
  await git(["clone", entry.remote, entry.directory], env);
  return "cloned";
}

/**
 * Clone every entry (or `--name`). In-repo entries: `git submodule update --init -- <path>`,
 * never `--recursive`, so a composed repo's own Compose entries stay uninitialized.
 */
export async function cloneCompose(
  env: NodeJS.ProcessEnv,
  name?: string,
): Promise<ComposeGitRun> {
  const { node } = await loadScope(env);
  const ownerDir = path.dirname(node.path);
  return eachCheckout(checkouts(node, name), async (entry) => {
    const at = await placement(ownerDir, entry.directory, env);
    if (at.kind === "standalone") return cloneStandalone(entry, env);
    const info = await submoduleAt(at.top, at.rel, env);
    if (!info) {
      if (!entry.remote)
        throw new Error(`Compose entry has no git remote: ${entry.name}`);
      if (existsSync(entry.directory) && !isEmptyDirectory(entry.directory) && !(await isOwnCheckout(entry.directory, env)))
        throw new Error(`Compose path exists and is not a git checkout: ${entry.directory}`);
      await addSubmodule(at, entry.remote, env);
      return "cloned";
    }
    if (entry.remote && info.url && !sameRemote(info.url, entry.remote))
      throw new Error(
        `Compose submodule URL does not match the registered remote: ${entry.name} (${info.url})`,
      );
    const initialized = await isOwnCheckout(entry.directory, env);
    await git(["-C", at.top, "submodule", "update", "--init", "--", at.rel], env);
    return initialized ? "present" : "cloned";
  });
}

/**
 * In-repo entries: `git submodule update --init --remote -- <path>`. When the submodule
 * is on a branch, `--merge` is added so local commits are merged instead of detached.
 */
export async function pullCompose(
  env: NodeJS.ProcessEnv,
  name?: string,
): Promise<ComposeGitRun> {
  const { node } = await loadScope(env);
  const ownerDir = path.dirname(node.path);
  return eachCheckout(checkouts(node, name), async (entry) => {
    const at = await placement(ownerDir, entry.directory, env);
    if (at.kind === "standalone") {
      await requireCheckout(entry, env);
      await git(["-C", entry.directory, "pull"], env);
      return "pulled";
    }
    if (!(await submoduleAt(at.top, at.rel, env)))
      throw new Error(
        `Compose entry is not a git submodule yet: ${entry.name}. Run edges compose clone --name ${entry.name}`,
      );
    const onBranch =
      (await isOwnCheckout(entry.directory, env)) &&
      (await gitTry(["-C", entry.directory, "symbolic-ref", "-q", "HEAD"], env)) !== undefined;
    await git(
      ["-C", at.top, "submodule", "update", "--init", "--remote", ...(onBranch ? ["--merge"] : []), "--", at.rel],
      env,
    );
    return "pulled";
  });
}

/** `git push` inside each checkout. A submodule on a detached HEAD fails with a clear message. */
export async function pushCompose(
  env: NodeJS.ProcessEnv,
  name?: string,
): Promise<ComposeGitRun> {
  const { node } = await loadScope(env);
  const ownerDir = path.dirname(node.path);
  return eachCheckout(checkouts(node, name), async (entry) => {
    const at = await placement(ownerDir, entry.directory, env);
    if (at.kind === "standalone") {
      await requireCheckout(entry, env);
      await git(["-C", entry.directory, "push"], env);
      return "pushed";
    }
    if (!(await isOwnCheckout(entry.directory, env)))
      throw new Error(
        `Compose checkout is missing: ${entry.name}. Run edges compose clone --name ${entry.name}`,
      );
    const branch = await gitTry(["-C", entry.directory, "symbolic-ref", "-q", "--short", "HEAD"], env);
    if (!branch)
      throw new Error(
        `Compose checkout is on a detached HEAD (git submodule default): ${entry.name}. ` +
          `Run git -C ${entry.directory} switch <branch>, commit there, then edges compose push.`,
      );
    await git(["-C", entry.directory, "push"], env);
    return "pushed";
  });
}
