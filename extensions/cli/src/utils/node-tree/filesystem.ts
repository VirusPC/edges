import { lstatSync, readFileSync, readdirSync, writeFileSync, chmodSync, renameSync, rmSync, realpathSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { walkTree } from './tree.js';

export interface NodeLocation { directory: string; entryPath: string }
export interface FileIdentity { directory: string; entryPath: string; device: number; inode: number }
export interface NodeFile { location: NodeLocation; source: string; identity: FileIdentity }

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

/** Read bytes only; no parsing, node policy or link interpretation. */
export function readNodeFile(directory: string): NodeFile | undefined {
  directory = absolute(directory);
  if (!isDirectory(directory)) return undefined;
  const entryPath = path.join(directory, 'AGENTS.md');
  const info = stat(entryPath);
  if (!info?.isFile()) return undefined;
  return {
    location: { directory, entryPath }, source: readFileSync(entryPath, 'utf8'),
    identity: { directory: realpathSync(directory), entryPath: realpathSync(entryPath), device: info.dev, inode: info.ino },
  };
}

/** Explicit atomic replacement with optimistic stale-source checks. No initialization. */
export function writeNodeFile(original: NodeFile, source: string): NodeFile {
  const directory = absolute(original.location.directory);
  const entryPath = path.join(directory, 'AGENTS.md');
  if (entryPath !== original.location.entryPath) throw new Error('Node entry path does not match its directory.');
  function validate() {
    const info = stat(entryPath);
    if (!isDirectory(directory) || !info?.isFile()) throw new Error('Node entry must remain a regular file, not a symlink.');
    const identity = original.identity;
    if (realpathSync(directory) !== identity.directory || realpathSync(entryPath) !== identity.entryPath || info.dev !== identity.device || info.ino !== identity.inode) {
      throw new Error('Node location or file identity changed since it was read; reload before saving.');
    }
    if (readFileSync(entryPath, 'utf8') !== original.source) throw new Error('Node source changed since it was read; reload before saving.');
    return info;
  }
  const info = validate();
  if (source === original.source) return original;
  const temporary = path.join(directory, `.AGENTS.${randomUUID()}.tmp`);
  try {
    writeFileSync(temporary, source, { flag: 'wx', mode: info.mode & 0o777 });
    chmodSync(temporary, info.mode & 0o777);
    validate();
    renameSync(temporary, entryPath);
  } finally { rmSync(temporary, { force: true }); }
  const saved = readNodeFile(directory);
  if (!saved || saved.source !== source || saved.identity.entryPath !== original.identity.entryPath) throw new Error('Node changed during save; reload its current contents.');
  return saved;
}

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
