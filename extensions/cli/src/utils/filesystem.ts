import { lstatSync, readdirSync } from 'node:fs';
import path from 'node:path';
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
