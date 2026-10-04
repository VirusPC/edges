import path from 'node:path';
import { absolute, readNodeFile, writeNodeFile, discoverDirectories, isDirectory } from './filesystem.js';
import { parseNode } from './codec/parse.js';
import { serializeNode } from './codec/serialize.js';
import { nodeLinks } from './model.js';
import { resolveNodeLinks } from './paths.js';
import { walkTree } from './tree.js';

/** @typedef {import('./model.js').NodeModel} NodeModel */
/**
 * Loaded envelope, not the domain model. Storage and codec can also be used independently.
 * @typedef {import('./filesystem.js').NodeFile & {
 *   model: NodeModel, links: {children: string[], references: string[]}
 * }} NodeEntry
 */

/** @param {import('./filesystem.js').NodeFile} file @returns {NodeEntry} */
function load(file) {
  const model = parseNode(file.source);
  return { ...file, model, links: resolveNodeLinks(nodeLinks(model), file.location.directory) };
}

/** @param {string} directory @returns {NodeEntry | undefined} */
export function readNode(directory) {
  const file = readNodeFile(directory);
  return file ? load(file) : undefined;
}

/** @param {NodeEntry} original @param {NodeModel} model @returns {NodeEntry} */
export function saveNode(original, model) {
  return load(writeNodeFile(original, serializeNode(model, original.source)));
}

/**
 * @typedef {object} DiscoverOptions
 * @property {(node: NodeEntry) => boolean} [acceptNode]
 * @property {(directory: string) => boolean} [enterDirectory]
 */

/** Physical inventory, not ownership. @param {string} root @param {DiscoverOptions} [options] @returns {NodeEntry[]} */
export function discoverNodes(root, options = {}) {
  return discoverDirectories(root, options.enterDirectory).flatMap(directory => {
    const node = readNode(directory);
    return node && (options.acceptNode?.(node) ?? true) ? [node] : [];
  });
}

/**
 * @typedef {object} NodeTreeOptions
 * @property {string} [boundary] Default: root. Explicitly widen it for non-descendant child links.
 * @property {(directory: string) => boolean} [canVisit] Applied to intervening directories, excluding explicit root/boundary.
 */

/** @param {string} root @param {NodeTreeOptions} [options] @returns {NodeEntry[]} */
export function readNodeTree(root, options = {}) {
  root = absolute(root);
  const boundary = absolute(options.boundary ?? root);
  /** @param {string} directory */
  function allowed(directory) {
    const relative = path.relative(boundary, directory);
    if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) return false;
    let current = boundary;
    if (!isDirectory(current)) return false;
    for (const segment of relative.split(path.sep).filter(Boolean)) {
      current = path.join(current, segment);
      if (!isDirectory(current)) return false;
      if (current !== root && options.canVisit && !options.canVisit(current)) return false;
    }
    return true;
  }
  if (!allowed(root)) return [];
  const first = readNode(root);
  if (!first) return [];
  return walkTree(first, node => node.links.children.flatMap(entry => {
    const directory = path.dirname(entry);
    const child = allowed(directory) ? readNode(directory) : undefined;
    return child ? [child] : [];
  }), node => node.location.directory);
}
