import { existsSync, lstatSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { TasksError } from '../tasks/utils/types.js';

/** A business/type AGENTS or a .harness container is not a scope. */
export function isScope(dir: string): boolean {
  const file = path.join(dir, 'AGENTS.md');
  try {
    const stat = lstatSync(file);
    if (!stat.isFile() || stat.isSymbolicLink()) return false;
    const text = readFileSync(file, 'utf8');
    return text.includes('<!-- project-memory:start -->') &&
      (text.includes('<!-- project-memory-local:start -->') || text.includes('<!-- project-memory-children:start -->'));
  } catch { return false; }
}

export function gitRoot(start: string): string | undefined {
  let dir = path.resolve(start);
  while (true) {
    if (existsSync(path.join(dir, '.git'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}

export function resolveScope(env: NodeJS.ProcessEnv = process.env, cwd = process.cwd(), explicit?: string): string {
  const target = explicit ?? (env.EDGES_SCOPE?.trim() || env.EDGES_REPO?.trim());
  if (target) return path.resolve(cwd, target);
  let dir = path.resolve(cwd);
  while (true) {
    if (isScope(dir) || existsSync(path.join(dir, '.git'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) throw new TasksError('VALIDATION_ERROR', 'No owning scope or Git repository found. Pass --scope <directory> or set EDGES_SCOPE.');
    dir = parent;
  }
}

/** Walk physical descendants, including maintenance modules, without crossing repositories. */
export function discoverScopes(root: string): string[] {
  const found = [path.resolve(root)];
  function visit(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a,b) => a.name.localeCompare(b.name))) {
      if (!entry.isDirectory() || entry.isSymbolicLink() || ['.git', 'node_modules', '.superpowers', 'dist', '_site'].includes(entry.name)) continue;
      const child = path.join(dir, entry.name);
      if (existsSync(path.join(child, '.git'))) continue;
      if (isScope(child)) found.push(child);
      visit(child);
    }
  }
  visit(path.resolve(root));
  return found;
}

export function portableScope(scopeDir: string, fallbackRoot = scopeDir): string {
  return path.relative(gitRoot(scopeDir) ?? fallbackRoot, scopeDir).split(path.sep).join('/') || '.';
}
