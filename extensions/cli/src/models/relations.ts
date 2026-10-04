import type { BaseNode } from './base-node.js';
import type { NodeReference } from './types.js';

type Relations = { parent?: NodeReference; children?: readonly NodeReference[] };
const relations = new WeakMap<BaseNode, Relations>();

export function validateChild(reference: NodeReference): void {
  if (reference.kind !== 'local' && reference.kind !== 'descendant') throw new Error('Child reference kind must be local or descendant.');
  if (!reference.target || /[\r\n]/.test(reference.target)) throw new Error('Child target must be a nonempty path without line breaks.');
}

/** Package-internal coordination for NodeService; never exported from the model entrypoint. */
export function setNodeRelations(node: BaseNode, value: Relations): void {
  value.children?.forEach(validateChild);
  relations.set(node, structuredClone(value));
}
export function nodeRelations(node: BaseNode): Relations {
  return structuredClone(relations.get(node) ?? {});
}
