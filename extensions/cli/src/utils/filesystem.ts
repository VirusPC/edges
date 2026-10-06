import { lstatSync, readdirSync, realpathSync, readlinkSync } from 'node:fs';
import path from 'node:path';
import { homedir } from 'node:os';
import { walkTree } from './tree.js';

export function absolute(directory: string) {
  if (!path.isAbsolute(directory)) throw new TypeError('Node paths must be absolute; resolve caller-relative paths before invoking storage.');
  return path.normalize(directory);
}

function stat(entry: string) {
  try { return lstatSync(entry); }
  catch (error) {
    if (['ENOENT', 'ENOTDIR'].includes((error as NodeJS.ErrnoException).code ?? '')) return undefined;
    throw error;
  }
}

export function isDirectory(directory: string) { return stat(directory)?.isDirectory() ?? false; }

/** The boundary is checked after the candidate so a boundary can itself match. */
export function findAncestor(start: string, matches: (directory: string) => boolean, stopAt?: (directory: string) => boolean): string | undefined {
  let directory = absolute(start);
  while (true) {
    if (matches(directory)) return directory;
    if (stopAt?.(directory)) return undefined;
    const parent = path.dirname(directory);
    if (parent === directory) return undefined;
    directory = parent;
  }
}

/** Physical directories only; callers decide which entries to read or parse. */
export function discoverDirectories(root: string, enterDirectory?: (directory: string) => boolean): string[] {
  root = absolute(root);
  if (!isDirectory(root)) return [];
  return walkTree(root, directory => readdirSync(directory, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter(entry => entry.isDirectory() && !entry.isSymbolicLink())
    .map(entry => path.join(directory, entry.name))
    .filter(child => enterDirectory?.(child) ?? true), directory => directory);
}

/** Match each option's established home shorthand without reading documents. */
export function expandHomePath(value: string, bareHome = false): string {
  return bareHome && value === '~' ? homedir() : value.startsWith('~/') ? path.join(homedir(), value.slice(2)) : value;
}

/** Lexical containment, including the root itself. */
export function isWithinPath(file: string, root: string): boolean {
  const relative = path.relative(path.resolve(root), path.resolve(file));
  return relative === '' || (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}

/** Resolve existing ancestors while retaining a missing suffix. */
export function canonicalPath(file: string): string {
  const active = new Set<string>();
  function resolve(candidate: string): string {
    candidate = path.resolve(candidate);
    if (active.has(candidate)) throw new Error(`Symbolic link cycle: ${candidate}`);
    active.add(candidate);
    try {
      try { return realpathSync(candidate); }
      catch (error) {
        if (!['ENOENT', 'ENOTDIR'].includes((error as NodeJS.ErrnoException).code ?? '')) throw error;
      }
      if (stat(candidate)?.isSymbolicLink())
        return resolve(path.resolve(path.dirname(candidate), readlinkSync(candidate)));
      const parent = path.dirname(candidate);
      return parent === candidate ? candidate : path.join(resolve(parent), path.basename(candidate));
    } finally { active.delete(candidate); }
  }
  return resolve(file);
}

/** Closest symbolic ancestor; the optional boundary is excluded. */
export function firstSymlink(file: string, stopAt?: string): string | undefined {
  file = path.resolve(file);
  const boundary = stopAt === undefined ? undefined : path.resolve(stopAt);
  if (boundary !== undefined && !isWithinPath(file, boundary))
    throw new Error(`Symbolic link boundary is not an ancestor: ${boundary}`);
  return findAncestor(file, candidate => candidate !== boundary && (stat(candidate)?.isSymbolicLink() ?? false),
    candidate => candidate === boundary);
}
