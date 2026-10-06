import matter from 'gray-matter';
import type { DocumentCodec, MarkdownDocument } from './types.js';

/** Adapt gray-matter's default YAML behavior to the shared document model. */
export function parseDocument(source: string): MarkdownDocument {
  // Document reads must not activate gray-matter's executable language engines.
  const text = source.replace(/^\uFEFF/, '');
  if (matter.test(text) && text[3] !== '-') {
    const { name } = matter.language(text);
    if (name && name !== 'yaml') throw new Error('Only YAML frontmatter is supported.');
  }
  // An options object disables gray-matter's shared mutable parse cache.
  const parsed = matter(source, {});
  return !parsed.matter && !('isEmpty' in parsed && parsed.isEmpty)
    ? { body: parsed.content }
    : { metadata: parsed.data, body: parsed.content };
}

export function serializeDocument(document: MarkdownDocument<string>, _originalSource?: string): string {
  return document.metadata === undefined
    ? document.body
    : matter.stringify({ content: document.body }, document.metadata);
}

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
