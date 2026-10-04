import { lstatSync, readFileSync, readdirSync, writeFileSync, chmodSync, renameSync, rmSync, realpathSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { walkTree } from './tree.js';

/** @typedef {{directory: string, entryPath: string}} NodeLocation */
/** @typedef {{directory: string, entryPath: string, device: number, inode: number}} FileIdentity */
/** @typedef {{location: NodeLocation, source: string, identity: FileIdentity}} NodeFile */

/** @param {string} directory */
export function absolute(directory) {
  if (!path.isAbsolute(directory)) throw new TypeError('Node paths must be absolute; resolve caller-relative paths before invoking storage.');
  return path.normalize(directory);
}

/** @param {string} entry */
function stat(entry) {
  try { return lstatSync(entry); }
  catch (error) {
    if (['ENOENT', 'ENOTDIR'].includes(/** @type {NodeJS.ErrnoException} */ (error).code ?? '')) return undefined;
    throw error;
  }
}

/** @param {string} directory */
export function isDirectory(directory) { return stat(directory)?.isDirectory() ?? false; }

/** Read bytes only; no parsing, node policy or link interpretation. @param {string} directory @returns {NodeFile | undefined} */
export function readNodeFile(directory) {
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

/**
 * Explicit atomic replacement with optimistic stale-source checks. No initialization.
 * @param {NodeFile} original
 * @param {string} source
 * @returns {NodeFile}
 */
export function writeNodeFile(original, source) {
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

/**
 * The boundary is checked after the candidate so a boundary can itself match.
 * @param {string} start
 * @param {(directory: string) => boolean} matches
 * @param {(directory: string) => boolean} [stopAt]
 * @returns {string | undefined}
 */
export function findAncestor(start, matches, stopAt) {
  let directory = absolute(start);
  while (true) {
    if (matches(directory)) return directory;
    if (stopAt?.(directory)) return undefined;
    const parent = path.dirname(directory);
    if (parent === directory) return undefined;
    directory = parent;
  }
}

/**
 * Physical directories only; callers decide which entries to read or parse.
 * @param {string} root
 * @param {(directory: string) => boolean} [enterDirectory]
 */
export function discoverDirectories(root, enterDirectory) {
  root = absolute(root);
  if (!isDirectory(root)) return [];
  return walkTree(root, directory => readdirSync(directory, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter(entry => entry.isDirectory() && !entry.isSymbolicLink())
    .map(entry => path.join(directory, entry.name))
    .filter(child => enterDirectory?.(child) ?? true), directory => directory);
}
