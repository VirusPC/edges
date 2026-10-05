import { InternalNode } from "../models/index.js";
import type {
  BaseNode,
  NodeReference,
  NodeQueryOptions,
} from "../models/index.js";
import { validateChild } from "../models/relations.js";

/** Preorder, demand-driven traversal; IO and directory contracts belong to the service. */
export async function* traverse(
  root: BaseNode,
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
  yield* visit(root);
}
