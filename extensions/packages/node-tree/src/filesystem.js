import { lstatSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { parseNodeLinks } from './links.js';
import { walkTree } from './tree.js';

/**
 * @typedef {import('./links.js').NodeLinks & {
 *   directory: string, entryPath: string, content: string
 * }} NodeEntry
 */

/** @param {string} directory */
function absolute(directory) {
  if (!path.isAbsolute(directory)) throw new TypeError('Node paths must be absolute; resolve caller-relative paths before invoking the core.');
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

/** @param {string} directory @returns {NodeEntry | undefined} */
export function readNode(directory) {
  directory = absolute(directory);
  if (!stat(directory)?.isDirectory()) return undefined;
  const entryPath = path.join(directory, 'AGENTS.md');
  if (!stat(entryPath)?.isFile()) return undefined;
  const content = readFileSync(entryPath, 'utf8');
  return { directory, entryPath, content, ...parseNodeLinks(content, directory) };
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
 * @typedef {object} DiscoverOptions
 * @property {(node: NodeEntry) => boolean} [acceptNode]
 * @property {(directory: string) => boolean} [enterDirectory] Applied to descendants, including non-node containers.
 */

/**
 * Physical inventory only: it does not infer ownership between nodes.
 * @param {string} root
 * @param {DiscoverOptions} [options]
 * @returns {NodeEntry[]}
 */
export function discoverNodes(root, options = {}) {
  root = absolute(root);
  if (!stat(root)?.isDirectory()) return [];
  const directories = walkTree(root, directory => readdirSync(directory, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter(entry => entry.isDirectory() && !entry.isSymbolicLink())
    .map(entry => path.join(directory, entry.name))
    .filter(child => options.enterDirectory?.(child) ?? true), directory => directory);
  return directories.flatMap(directory => {
    const node = readNode(directory);
    return node && (options.acceptNode?.(node) ?? true) ? [node] : [];
  });
}

/**
 * @typedef {object} NodeTreeOptions
 * @property {string} [boundary] Default: root. Explicitly widen it for non-descendant child links.
 * @property {(directory: string) => boolean} [canVisit] Applied to intervening directories, excluding explicit root/boundary.
 */

/**
 * Logical child-index traversal; ordinary cross-references are not followed.
 * @param {string} root
 * @param {NodeTreeOptions} [options]
 * @returns {NodeEntry[]}
 */
export function readNodeTree(root, options = {}) {
  root = absolute(root);
  const boundary = absolute(options.boundary ?? root);
  /** @param {string} directory */
  function allowed(directory) {
    const relative = path.relative(boundary, directory);
    if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) return false;
    let current = boundary;
    if (!stat(current)?.isDirectory()) return false;
    for (const segment of relative.split(path.sep).filter(Boolean)) {
      current = path.join(current, segment);
      if (!stat(current)?.isDirectory()) return false;
      if (current !== root && options.canVisit && !options.canVisit(current)) return false;
    }
    return true;
  }
  if (!allowed(root)) return [];
  const first = readNode(root);
  if (!first) return [];
  return walkTree(first, node => node.children.flatMap(entry => {
    const directory = path.dirname(entry);
    const child = allowed(directory) ? readNode(directory) : undefined;
    return child ? [child] : [];
  }), node => node.directory);
}
