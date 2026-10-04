/** Ordered depth-first traversal. Identity, edges and ownership belong to the caller. */
export function walkTree<T>(root: T, children: (node: T) => readonly T[], key: (node: T) => string): T[] {

  const result: T[] = [];
  const visited = new Set<string>();
  const pending = [root];
  while (pending.length) {
    const node = pending.pop()!;
    const id = key(node);
    if (visited.has(id)) continue;
    visited.add(id);
    result.push(node);
    const next = children(node);
    for (let i = next.length - 1; i >= 0; i--) pending.push(next[i]);
  }
  return result;
}
