import { basename, dirname, join } from "node:path";
import { BaseNode } from "../core/base-node.js";
import { ENTRY_NAMES } from "../config/layout.js";
import { pathHitsExcludedModule } from "../config/exclude.js";
import { normalizeNodeType } from "../models/node/layout.js";
import type { NodeReference } from "../core/types.js";
import { validateChild } from "../core/relations.js";

export interface ScopeTraversalOptions {
  /** When true, expand only localChildren. Default false: local ∪ descendants. */
  localOnly?: boolean;
  includeHarness?: boolean;
  /** Explicit `--super`: root traversal at a runtime SuperAgentsNode. */
  super?: boolean;
  /** Global `--exclude`: skip these module names during traversal. */
  exclude?: ReadonlySet<string>;
  /** Scope directory used to recognize `.harness/<module>` paths. Defaults to the service root. */
  scopeDir?: string;
  /**
   * Forest assembly: do not descend into these absolute entry paths
   * (other system roots). Used outside traverse's single-system contract.
   */
  excludeRoots?: ReadonlySet<string>;
}
/** Same-directory README next to an AGENTS.md (content face). Not an AGENTS child. */
export function contentFaceReadme(node: BaseNode): NodeReference | undefined {
  if (node.type !== "agents") return undefined;
  if (basename(node.path) !== ENTRY_NAMES.internal) return undefined;
  return { id: join(dirname(node.path), ENTRY_NAMES.readme) };
}

function structuralChildren(
  node: BaseNode,
  options: ScopeTraversalOptions,
): readonly NodeReference[] {
  return options.localOnly ? (node.localChildren ?? node.children) : node.children;
}

export interface NodeQueryOptions extends ScopeTraversalOptions {
  types?: readonly string[];
}

export interface ReachOptions {
  all?: boolean;
  super?: boolean;
  exclude?: ReadonlySet<string>;
}

/** Root `--super` / `--exclude` as query options. */
export function scopeTraversal(flags: { super?: boolean; exclude?: ReadonlySet<string> } = {}): Pick<NodeQueryOptions, "super" | "exclude"> {
  return {
    ...(flags.super ? { super: true } : {}),
    ...(flags.exclude && flags.exclude.size > 0 ? { exclude: flags.exclude } : {}),
  };
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
  const matches = (node: BaseNode) =>
    !options.types || options.types.map(normalizeNodeType).includes(node.type);
  const excluded = (id: string) =>
    options.scopeDir !== undefined && pathHitsExcludedModule(id, options.scopeDir, options.exclude);

  async function* visit(node: BaseNode, stop: boolean): AsyncGenerator<BaseNode> {
    if (active.has(node.path))
      throw new Error(`Composition cycle: ${node.path}`);
    if (seen.has(node.path)) return;
    seen.add(node.path);
    active.add(node.path);
    try {
      if (matches(node)) yield node;
      if (stop) return;
      const harness = options.includeHarness ? node.harness : undefined;
      const childMode = node.childTraversal() === "leaf" ? "entry" : "expand";
      for (const reference of structuralChildren(node, options)) {
        if (excluded(reference.id)) continue;
        yield* step(node, reference, harness, childMode);
      }
      if (harness && !excluded(harness.id)) yield* step(node, harness, harness, "expand");
    } finally {
      active.delete(node.path);
    }
  }

  async function* step(
    parent: BaseNode,
    reference: NodeReference,
    harness: NodeReference | undefined,
    mode: "expand" | "mount" | "entry",
  ): AsyncGenerator<BaseNode> {
    validateChild(reference);
    const target = resolve(parent, reference);
    if (target === undefined) return;
    if (active.has(target)) {
      if (reference === harness) return;
      throw new Error(`Composition cycle: ${target}`);
    }
    if (seen.has(target)) return;
    const loaded = await load(parent, reference, target);
    if (mode === "mount") {
      if (active.has(loaded.path))
        throw new Error(`Composition cycle: ${loaded.path}`);
      if (seen.has(loaded.path)) return;
      seen.add(loaded.path);
      active.add(loaded.path);
      try {
        for (const child of loaded.children)
          yield* step(loaded, child, undefined, "entry");
      } finally {
        active.delete(loaded.path);
      }
      return;
    }
    yield* visit(loaded, mode === "entry");
  }

  for (const root of roots instanceof BaseNode ? [roots] : roots)
    yield* visit(root, false);
}
