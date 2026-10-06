import { existsSync, readdirSync, rmSync, statSync } from "node:fs";
import path from "node:path";

const SKIP = new Set(["node_modules", ".git", "dist", ".worktrees"]);

function walk(dir: string, out: string[]): void {
  let names: string[];
  try {
    names = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of names) {
    if (SKIP.has(name)) continue;
    const abs = path.join(dir, name);
    let info;
    try {
      info = statSync(abs);
    } catch {
      continue;
    }
    if (info.isDirectory()) walk(abs, out);
    else if (name === "SKILL.md") out.push(abs);
  }
}

export function listSkills(root: string) {
  const absRoot = path.resolve(root);
  const files: string[] = [];
  walk(absRoot, files);
  return files.sort().map((file) => ({
    name: path.basename(path.dirname(file)),
    path: path.relative(absRoot, file),
  }));
}

function resolveSkill(root: string, target: string): string {
  const absRoot = path.resolve(root);
  const direct = path.resolve(absRoot, target);
  if (existsSync(direct) && path.basename(direct) === "SKILL.md") return direct;
  const matches = listSkills(absRoot).filter((item) => item.name === target || item.path === target);
  if (matches.length !== 1) {
    throw new Error(matches.length === 0 ? `skill not found: ${target}` : `skill name is ambiguous: ${target}`);
  }
  return path.resolve(absRoot, matches[0]!.path);
}

export function getSkill(root: string, target: string) {
  const file = resolveSkill(root, target);
  return { name: path.basename(path.dirname(file)), path: path.relative(path.resolve(root), file) };
}

export function deleteSkill(root: string, target: string) {
  const file = resolveSkill(root, target);
  rmSync(path.dirname(file), { recursive: true, force: true });
  return { path: path.relative(path.resolve(root), file) };
}
