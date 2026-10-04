import type { DocumentCodec, MarkdownDocument } from '../../utils/markdown/types.js';
import type { NodeModel } from './model.js';
import { parseDocument, serializeDocument } from '../../utils/markdown/document.js';
import { parseNode } from './parse.js';
import { serializeNode } from './serialize.js';

/** Bind shared format handling to a family; domain adapters may add validation. */
export function createMarkdownCodec<TType extends string>(
  type: TType,
): DocumentCodec<MarkdownDocument<TType>, TType> {
  return {
    type,
    parse(source) { return { ...parseDocument(source), type }; },
    serialize(document, originalSource) {
      if (document.type !== undefined && document.type !== type) {
        throw new Error(`Document type ${document.type} does not match codec ${type}.`);
      }
      return serializeDocument(document, originalSource);
    },
  };
}

export const baseDocumentCodec = createMarkdownCodec('base');
/** Memory-specific content rules still belong to the consuming domain. */
export const memoryDocumentCodec = createMarkdownCodec('memory');

/** AGENTS has a section model rather than an opaque Markdown body. */
export const agentsDocumentCodec: DocumentCodec<NodeModel, 'agents'> = {
  type: 'agents',
  parse: parseNode,
  serialize: serializeNode,
};
