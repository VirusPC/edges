import { InternalNode } from '../models/index.js';
import type { BaseNode, NodeReference, ScopeTraversalOptions } from '../models/index.js';
import { validateChild } from '../models/relations.js';

/** Internal preorder traversal; loading and target resolution belong to the caller. */
export async function traverse(
  root: BaseNode,
  options: ScopeTraversalOptions,
  resolve: (parent: BaseNode, reference: NodeReference) => string,
  load: (parent: BaseNode, reference: NodeReference, target: string) => Promise<BaseNode>,
): Promise<BaseNode[]> {
  const seen = new Set<string>(), active = new Set<string>(), result: BaseNode[] = [];
  async function visit(node: BaseNode): Promise<void> {
    if (active.has(node.path)) throw new Error(`Ownership cycle: ${node.path}`);
    if (seen.has(node.path)) return;
    seen.add(node.path); active.add(node.path); result.push(node);
    for (const reference of node instanceof InternalNode && !options.includeDescendants ? node.localChildren : node.children) {
      validateChild(reference);
      const target = resolve(node, reference);
      if (active.has(target)) throw new Error(`Ownership cycle: ${target}`);
      if (!seen.has(target)) await visit(await load(node, reference, target));
    }
    active.delete(node.path);
  }
  await visit(root);
  return result;
}
