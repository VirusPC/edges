import { basename, dirname, join } from "node:path";
import { BaseNode } from "../models/core/base-node.js";
import { ENTRY_NAMES, normalizeNodeType } from "../models/layout.js";
import type { NodeReference } from "../models/core/types.js";
import { validateChild } from "../models/core/relations.js";

export interface ScopeTraversalOptions {
  /** When true, expand only localChildren. Default false: local ∪ descendants. */
  localOnly?: boolean;
  includeHarness?: boolean;
  /** Explicit `--super`: root traversal at a runtime SuperAgentsNode over the Edges root README.md. */
  super?: boolean;
}

/**
 * Dual-file scope contract: a scope AGENTS.md is accompanied by the README.md
 * in the same directory. The edge exists only at traversal time; it is never
 * written into the AGENTS composition fields. Callers decide, in resolve,
 * whether the companion file exists.
 */
export function companionReadme(node: BaseNode): NodeReference | undefined {
  if (node.type !== "agents") return undefined;
  if (basename(node.path) !== ENTRY_NAMES.internal) return undefined;
  return { id: join(dirname(node.path), ENTRY_NAMES.readme) };
}

export function isCompanionReadme(
  parent: BaseNode,
  reference: NodeReference,
): boolean {
  return (
    companionReadme(parent)?.id === reference.id &&
    !parent.children.some((child) => child.id === reference.id)
  );
}

function expandedChildren(
  node: BaseNode,
  options: ScopeTraversalOptions,
): readonly NodeReference[] {
  const own = options.localOnly
    ? (node.localChildren ?? node.children)
    : node.children;
  const companion = companionReadme(node);
  return companion ? [...own, companion] : own;
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
      if (!options.types || options.types.map(normalizeNodeType).includes(node.type)) yield node;
      const harness = options.includeHarness ? node.harness : undefined;
      for (const reference of [
        ...expandedChildren(node, options),
        ...(harness ? [harness] : []),
      ]) {
        validateChild(reference);
        const target = resolve(node, reference);
        if (target === undefined) continue;
        if (active.has(target)) {
          // The dual-file pair links both ways at runtime: README harness → AGENTS → companion README.
          if (reference === harness || isCompanionReadme(node, reference)) continue;
          throw new Error(`Composition cycle: ${target}`);
        }
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
