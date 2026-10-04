/**
 * Ordered depth-first traversal. Identity, edges and ownership belong to the caller.
 * @template T
 * @param {T} root
 * @param {(node: T) => readonly T[]} children
 * @param {(node: T) => string} key
 * @returns {T[]}
 */
export function walkTree(root, children, key) {
  /** @type {T[]} */
  const result = [];
  const visited = new Set();
  const pending = [root];
  while (pending.length) {
    const node = /** @type {T} */ (pending.pop());
    const id = key(node);
    if (visited.has(id)) continue;
    visited.add(id);
    result.push(node);
    const next = children(node);
    for (let i = next.length - 1; i >= 0; i--) pending.push(next[i]);
  }
  return result;
}
