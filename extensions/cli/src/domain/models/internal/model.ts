import type { Metadata } from '../../../utils/markdown/types.js';

export type { Metadata, MetadataValue } from '../../../utils/markdown/types.js';

export type NodeText = { kind: 'text'; value: string };
export type NodeLink = { kind: 'link'; label: string; target: string };
export type NodeItem = { content: (NodeText | NodeLink)[] };
export type SectionKey = 'constraints' | 'memory' | 'children';

/** Format-independent content; targets remain identifiers supplied by the author. */
export interface NodeModel {
  metadata?: Metadata;
  constraints: NodeItem[];
  memory: NodeItem[];
  children: NodeItem[];
  references: NodeLink[];
}

export function createNodeModel(): NodeModel {
  return { constraints: [], memory: [], children: [], references: [] };
}

export function nodeLinks(model: NodeModel) {
  const links = (items: NodeItem[]): NodeLink[] => items.flatMap(item => item.content.filter(run => run.kind === 'link'));
  return {
    children: links(model.children),
    references: [...links(model.constraints), ...links(model.memory), ...model.references],
  };
}
