import { createHash } from "node:crypto";
import { existsSync, lstatSync, readdirSync, readFileSync, readlinkSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

export const SKILL_INSTALL_MANIFEST = ".edges-skills.json";

/** Skills shipped with the current package. */
export const OFFICIAL_BUNDLED_SKILLS = [
  "edges",
  "edges-langfuse-agent-tracing",
  "edges-onboarding",
] as const;

/**
 * Official skill names removed when they were folded into `edges`.
 * Only these names are eligible on a machine that has no install manifest yet.
 */
export const RETIRED_BUNDLED_SKILLS = [
  "edges-memory-ask",
  "edges-memory-remember",
  "edges-memory-add-type",
  "edges-create-notes",
  "edges-create-tasks",
  "edges-tasks-classify",
] as const;

/**
 * Content hashes of those skills as published on main before the fold (53dd032).
 * A directory that still matches one of these was not edited after install.
 */
export const RETIRED_PUBLISHED_HASHES: Readonly<Record<string, readonly string[]>> = {
  "edges-memory-ask": ["1ac4db156927dc672986e74d529057d815dbd84f6156578431172dc992f6e1eb"],
  "edges-memory-remember": ["ee5114543ff59b4487ea1a35e2da33757d990c00ecc6c0171c7ce5bf3c300d29"],
  "edges-memory-add-type": ["fbf25938c16e0c14dc51ef647d227a932ab168cafa9c4be5bbd4edae3b462aea"],
  "edges-create-notes": ["8f263b066929cb8e24087da237742126cefe4740b31db21dd18cf62dd6b55aa9"],
  "edges-create-tasks": ["a8657b0b5c360fa52cc2c57abd5b098aafbe1b992c98cec5690c9ab4371bf8a3"],
  "edges-tasks-classify": ["661f0cfdee14e80d2b255ff1efeddd39f728dec9c48719d2494278afcd0347c2"],
};

const PROJECT_SKILL_DIRS = [".agents/skills", ".claude/skills", ".codex/skills", ".cursor/skills"];

export type SkillInstallManifest = {
  version: 1;
  skills: Record<string, { hash: string }>;
};

export type SkillCleanupAction =
  | { kind: "delete"; name: string; path: string }
  | { kind: "warn"; name: string; path: string }
  | { kind: "unlink"; path: string };

export function hashSkillDir(dir: string): string {
  const lines: string[] = [];
  const walk = (rel: string) => {
    const abs = path.join(dir, rel);
    const stat = lstatSync(abs);
    if (stat.isSymbolicLink()) {
      lines.push(`link ${rel} ${readlinkSync(abs)}`);
      return;
    }
    if (stat.isDirectory()) {
      for (const name of readdirSync(abs).sort()) walk(rel ? path.join(rel, name) : name);
      return;
    }
    const digest = createHash("sha256").update(readFileSync(abs)).digest("hex");
    lines.push(`file ${rel} ${digest}`);
  };
  for (const name of readdirSync(dir).sort()) walk(name);
  lines.sort();
  return createHash("sha256").update(lines.join("\n")).digest("hex");
}

export function skillRootsFromInstallArgs(cwd: string, forwarded: readonly string[]): string[] {
  const global = forwarded.includes("-g") || forwarded.includes("--global");
  const root = global ? path.join(homedir(), ".agents", "skills") : path.join(cwd, ".agents", "skills");
  return [root];
}

function readManifest(root: string): SkillInstallManifest | null {
  const file = path.join(root, SKILL_INSTALL_MANIFEST);
  if (!existsSync(file)) return null;
  const parsed = JSON.parse(readFileSync(file, "utf8")) as SkillInstallManifest;
  if (parsed.version !== 1 || !parsed.skills) return null;
  return parsed;
}

function manualRemoval(skillPath: string): string {
  return `warning: ${path.basename(skillPath)} was installed by edges but its contents changed; left in place. Remove it manually: rm -rf ${skillPath}`;
}

function planEntry(
  root: string,
  name: string,
  manifest: SkillInstallManifest | null,
  publishedHashes: Readonly<Record<string, readonly string[]>>,
): SkillCleanupAction | null {
  const skillPath = path.join(root, name);
  if (!existsSync(skillPath) && !lstatExists(skillPath)) return null;
  const stat = lstatSync(skillPath);
  if (stat.isSymbolicLink()) {
    const target = path.resolve(path.dirname(skillPath), readlinkSync(skillPath));
    if (!existsSync(target)) return { kind: "delete", name, path: skillPath };
    return null;
  }
  if (!stat.isDirectory()) return null;
  const hash = hashSkillDir(skillPath);
  if (manifest) {
    const recorded = manifest.skills[name]?.hash;
    if (!recorded) return null;
    if (hash === recorded) return { kind: "delete", name, path: skillPath };
    return { kind: "warn", name, path: skillPath };
  }
  const published = publishedHashes[name] ?? [];
  if (published.includes(hash)) return { kind: "delete", name, path: skillPath };
  return { kind: "warn", name, path: skillPath };
}

function lstatExists(file: string): boolean {
  try {
    lstatSync(file);
    return true;
  } catch {
    return false;
  }
}

function symlinkDirs(cwd: string, global: boolean): string[] {
  if (global) {
    return [path.join(homedir(), ".agents", "skills"), path.join(homedir(), ".claude", "skills")];
  }
  return PROJECT_SKILL_DIRS.map((dir) => path.join(cwd, dir));
}

function danglingSymlinks(cwd: string, global: boolean, deleted: readonly string[]): SkillCleanupAction[] {
  const deletedReal = new Set(deleted.map((file) => {
    try {
      return path.resolve(file);
    } catch {
      return file;
    }
  }));
  const deletedNames = new Set(deleted.map((file) => path.basename(file)));
  const actions: SkillCleanupAction[] = [];
  for (const dir of symlinkDirs(cwd, global)) {
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir)) {
      const link = path.join(dir, name);
      let stat;
      try {
        stat = lstatSync(link);
      } catch {
        continue;
      }
      if (!stat.isSymbolicLink()) continue;
      const target = path.resolve(path.dirname(link), readlinkSync(link));
      const pointsAtDeleted = deletedReal.has(target) || (deletedNames.has(name) && !existsSync(target));
      if (!pointsAtDeleted) continue;
      if (deletedReal.has(path.resolve(link))) continue;
      actions.push({ kind: "unlink", path: link });
    }
  }
  return actions;
}

export function planEdgesSkillCleanup(
  root: string,
  options: {
    cwd: string;
    global?: boolean;
    publishedHashes?: Readonly<Record<string, readonly string[]>>;
  } = { cwd: path.dirname(path.dirname(root)) },
): SkillCleanupAction[] {
  if (!existsSync(root)) return [];
  const manifest = readManifest(root);
  const official = new Set<string>(OFFICIAL_BUNDLED_SKILLS);
  const names = manifest
    ? Object.keys(manifest.skills).filter((name) => !official.has(name))
    : [...RETIRED_BUNDLED_SKILLS];
  const publishedHashes = options.publishedHashes ?? RETIRED_PUBLISHED_HASHES;
  const actions: SkillCleanupAction[] = [];
  for (const name of names) {
    const action = planEntry(root, name, manifest, publishedHashes);
    if (action) actions.push(action);
  }
  const deleted = actions.filter((action) => action.kind === "delete").map((action) => action.path);
  actions.push(...danglingSymlinks(options.cwd, options.global === true, deleted));
  return actions;
}

export function applyEdgesSkillCleanup(
  root: string,
  options: {
    dryRun?: boolean;
    cwd?: string;
    global?: boolean;
    publishedHashes?: Readonly<Record<string, readonly string[]>>;
  } = {},
): SkillCleanupAction[] {
  const cwd = options.cwd ?? path.dirname(path.dirname(root));
  const actions = planEdgesSkillCleanup(root, {
    cwd,
    global: options.global,
    publishedHashes: options.publishedHashes,
  });
  if (options.dryRun) return actions;
  for (const action of actions) {
    if (action.kind === "delete") rmSync(action.path, { recursive: true, force: true });
    if (action.kind === "unlink") unlinkSync(action.path);
  }
  writeManifest(root);
  return actions;
}

function writeManifest(root: string): void {
  if (!existsSync(root)) return;
  const previous = readManifest(root);
  const skills: SkillInstallManifest["skills"] = {};
  if (previous) {
    for (const [name, entry] of Object.entries(previous.skills)) {
      if ((OFFICIAL_BUNDLED_SKILLS as readonly string[]).includes(name)) continue;
      const skillPath = path.join(root, name);
      if (existsSync(skillPath)) skills[name] = entry;
    }
  }
  for (const name of OFFICIAL_BUNDLED_SKILLS) {
    const skillPath = path.join(root, name);
    if (!existsSync(skillPath) || !lstatSync(skillPath).isDirectory()) continue;
    skills[name] = { hash: hashSkillDir(skillPath) };
  }
  const manifest: SkillInstallManifest = { version: 1, skills };
  writeFileSync(path.join(root, SKILL_INSTALL_MANIFEST), `${JSON.stringify(manifest, null, 2)}\n`);
}

export function formatSkillCleanup(actions: readonly SkillCleanupAction[], dryRun: boolean): string {
  const lines: string[] = [];
  for (const action of actions) {
    if (action.kind === "delete") {
      lines.push(
        `${dryRun ? "dry-run: would remove" : "removed"} edges-installed skill ${action.name} (${action.path})`,
      );
    } else if (action.kind === "warn") {
      lines.push(manualRemoval(action.path));
    } else {
      lines.push(`${dryRun ? "dry-run: would remove symlink" : "removed symlink"} ${action.path}`);
    }
  }
  return lines.length ? `${lines.join("\n")}\n` : "";
}
