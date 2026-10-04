import { existsSync } from 'node:fs';
import path from 'node:path';
import { discoverNodes, findAncestor, readNode, type NodeEntry } from '@edges/node-tree';

/** Current command-selection policy, not the reusable node identity contract. */
function selectsScope(node: NodeEntry): boolean {
  return node.source.includes('<!-- project-memory:start -->') &&
    (node.source.includes('<!-- project-memory-local:start -->') || node.source.includes('<!-- project-memory-children:start -->'));
}

export function isScope(dir: string): boolean {
  const node = readNode(path.resolve(dir));
  return node !== undefined && selectsScope(node);
}

function isGitBoundary(directory: string): boolean {
  return existsSync(path.join(directory, '.git'));
}

export function gitRoot(start: string): string | undefined {
  return findAncestor(path.resolve(start), isGitBoundary);
}

export class ScopeResolutionError extends Error {
  readonly errorCode = 'VALIDATION_ERROR';
  constructor() {
    super('No owning scope or Git repository found. Pass --scope <directory> or set EDGES_SCOPE.');
    this.name = 'ScopeResolutionError';
  }
}

export function resolveScope(env: NodeJS.ProcessEnv = process.env, cwd = process.cwd(), explicit?: string): string {
  const target = explicit ?? (env.EDGES_SCOPE?.trim() || env.EDGES_REPO?.trim());
  if (target) return path.resolve(cwd, target);
  const found = findAncestor(path.resolve(cwd), dir => isScope(dir) || isGitBoundary(dir));
  if (!found) throw new ScopeResolutionError();
  return found;
}

/** CLI inventory policy. Logical child-index traversal is a separate core operation. */
export function discoverScopes(root: string): string[] {
  root = path.resolve(root);
  const ignored = new Set(['.git', 'node_modules', '.superpowers', 'dist', '_site']);
  const nodes = discoverNodes(root, {
    acceptNode: selectsScope,
    enterDirectory: dir => !ignored.has(path.basename(dir)) && !isGitBoundary(dir),
  });
  return [root, ...nodes.filter(node => node.location.directory !== root).map(node => node.location.directory)];
}

export function portableScope(scopeDir: string, fallbackRoot = scopeDir): string {
  return path.relative(gitRoot(scopeDir) ?? fallbackRoot, scopeDir).split(path.sep).join('/') || '.';
}
