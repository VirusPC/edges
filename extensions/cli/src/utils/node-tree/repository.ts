import type { NodeFile } from './filesystem.js';
import type { NodeModel } from './model.js';
import path from 'node:path';
import { absolute, readNodeFile, writeNodeFile, discoverDirectories, isDirectory } from './filesystem.js';
import { parseNode } from './codec/parse.js';
import { serializeNode } from './codec/serialize.js';
import { nodeLinks } from './model.js';
import { resolveNodeLinks } from './paths.js';
import { walkTree } from './tree.js';

/** Loaded envelope, not the domain model. */
export type NodeEntry = NodeFile & { model: NodeModel; links: { children: string[]; references: string[] } };
export interface DiscoverOptions {
  acceptNode?: (node: NodeEntry) => boolean;
  enterDirectory?: (directory: string) => boolean;
}
export interface NodeTreeOptions {
  /** Default: root. Explicitly widen for non-descendant child links. */
  boundary?: string;
  /** Applies to intervening directories, excluding explicit root/boundary. */
  canVisit?: (directory: string) => boolean;
}

function load(file: NodeFile): NodeEntry {
  const model = parseNode(file.source);
  return { ...file, model, links: resolveNodeLinks(nodeLinks(model), file.location.directory) };
}

export function readNode(directory: string): NodeEntry | undefined {
  const file = readNodeFile(directory);
  return file ? load(file) : undefined;
}

export function saveNode(original: NodeEntry, model: NodeModel): NodeEntry {
  return load(writeNodeFile(original, serializeNode(model, original.source)));
}

/** Physical inventory, not ownership. */
export function discoverNodes(root: string, options: DiscoverOptions = {}): NodeEntry[] {
  return discoverDirectories(root, options.enterDirectory).flatMap(directory => {
    const node = readNode(directory);
    return node && (options.acceptNode?.(node) ?? true) ? [node] : [];
  });
}

export function readNodeTree(root: string, options: NodeTreeOptions = {}): NodeEntry[] {
  root = absolute(root);
  const boundary = absolute(options.boundary ?? root);

  function allowed(directory: string): boolean {
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
