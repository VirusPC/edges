import { BaseNode } from "../models/core/base-node.js";
import { InternalNode } from "../models/internal/internal-node.js";
import type { NodeReference } from "../models/core/types.js";
import { validateChild } from "../models/core/relations.js";

export interface ScopeTraversalOptions {
  includeDescendants?: boolean;
  includeHarness?: boolean;
}

export interface NodeQueryOptions extends ScopeTraversalOptions {
  types?: readonly string[];
}

/** Preorder, demand-driven traversal; IO and directory contracts belong to the service. */
export async function* traverse(
  roots: BaseNode | Iterable<BaseNode>,
  options: NodeQueryOptions,
  resolve: (parent: BaseNode, reference: NodeReference) => string | undefined,
  load: (
    parent: BaseNode,
    reference: NodeReference,
    target: string,
  ) => Promise<BaseNode>,
): AsyncGenerator<BaseNode> {
  const seen = new Set<string>(),
    active = new Set<string>();
  async function* visit(node: BaseNode): AsyncGenerator<BaseNode> {
    if (active.has(node.path))
      throw new Error(`Composition cycle: ${node.path}`);
    if (seen.has(node.path)) return;
    seen.add(node.path);
    active.add(node.path);
    try {
      if (!options.types || options.types.includes(node.type)) yield node;
      const children =
        node instanceof InternalNode && !options.includeDescendants
          ? node.localChildren
          : node.children;
      for (const reference of [
        ...children,
        ...(options.includeHarness && node.harness ? [node.harness] : []),
      ]) {
        validateChild(reference);
        const target = resolve(node, reference);
        if (target === undefined) continue;
        if (active.has(target)) throw new Error(`Composition cycle: ${target}`);
        if (!seen.has(target))
          yield* visit(await load(node, reference, target));
      }
    } finally {
      active.delete(node.path);
    }
  }
  for (const root of roots instanceof BaseNode ? [roots] : roots)
    yield* visit(root);
}
