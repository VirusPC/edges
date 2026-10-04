/** @typedef {{kind: 'text', value: string}} NodeText */
/** @typedef {{kind: 'link', label: string, target: string}} NodeLink */
/** @typedef {{content: (NodeText | NodeLink)[]}} NodeItem */
/** @typedef {'constraints' | 'memory' | 'children'} SectionKey */
/**
 * Format-independent node content. Link targets remain identifiers supplied by the author.
 * @typedef {{constraints: NodeItem[], memory: NodeItem[], children: NodeItem[], references: NodeLink[]}} NodeModel
 */

/** @returns {NodeModel} */
export function createNodeModel() {
  return { constraints: [], memory: [], children: [], references: [] };
}

/** @param {NodeModel} model */
export function nodeLinks(model) {
  /** @param {NodeItem[]} items @returns {NodeLink[]} */
  const links = items => items.flatMap(item => item.content.filter(run => run.kind === 'link'));
  return {
    children: links(model.children),
    references: [...links(model.constraints), ...links(model.memory), ...model.references],
  };
}
