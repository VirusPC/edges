import type { Metadata, MetadataValue, MarkdownDocument } from '../document-model.js';
import matter from 'gray-matter';
import { CORE_SCHEMA, dump, load, realMapTag } from 'js-yaml';

export const sameValue = (a: unknown, b: unknown) => JSON.stringify(a, orderedKeys) === JSON.stringify(b, orderedKeys);

function orderedKeys(_key: string, value: unknown): unknown {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b))) : value;
}

/** Split syntax only; header presence is distinct from an empty header. */
export function splitFrontmatter(source: string) {
  const bom = source.startsWith('\uFEFF') ? '\uFEFF' : '';
  const text = source.slice(bom.length);
  const open = /^---[\t ]*\r?\n/.exec(text);
  if (!open) return { bom, prefix: '', rawFrontmatter: undefined, body: text };
  const rest = text.slice(open[0].length);
  const close = /^(?:---|\.\.\.)[\t ]*(?:\r?\n|$)/m.exec(rest);
  if (!close) throw new Error('Unclosed YAML frontmatter.');
  const end = open[0].length + close.index + close[0].length;
  return {
    bom, prefix: text.slice(0, end),
    rawFrontmatter: rest.slice(0, close.index),
    body: text.slice(end),
  };
}

/** Keep the public metadata model JSON-compatible and aliases independent. */
function readValue(value: unknown, ancestors = new Set<object>(), budget = { remaining: 100_000 }): MetadataValue {
  if (--budget.remaining < 0 || ancestors.size > 100) throw new Error('Frontmatter complexity limit exceeded.');
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || (Number.isInteger(value) && !Number.isSafeInteger(value))) {
      throw new Error('Frontmatter numbers must be finite and integers must be safe JSON numbers.');
    }
    return value;
  }
  if (!value || typeof value !== 'object' || ancestors.has(value)) throw new Error('Frontmatter must contain finite, acyclic JSON-compatible values.');
  ancestors.add(value);
  try {
    if (Array.isArray(value)) return value.map(item => readValue(item, ancestors, budget));
    if (value instanceof Map) {
      for (const key of value.keys()) if (typeof key !== 'string') throw new Error('Frontmatter mapping keys must be strings.');
      return Object.fromEntries([...value].map(([key, item]) => [key, readValue(item, ancestors, budget)]));
    }
    if (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null) {
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, readValue(item, ancestors, budget)]));
    }
    throw new Error('Unsupported frontmatter value.');
  } finally { ancestors.delete(value); }
}

function isRecord(value: MetadataValue): value is Metadata { return value !== null && typeof value === 'object' && !Array.isArray(value); }

// Core schema keeps dates as strings. gray-matter removes the newline before
// the closing delimiter; restore it for YAML block scalars. Only YAML is parsed.
const yamlEngine = { parse: (source: string) => {
  const metadata = readValue(load(source + '\n', { schema: CORE_SCHEMA.withTags(realMapTag) }));
  if (!isRecord(metadata)) throw new Error('Frontmatter must be a mapping.');
  return metadata;
} };

/** Optional YAML metadata plus opaque Markdown; no domain rules or IO. */
export function parseDocument(source: string): MarkdownDocument {
  const { rawFrontmatter, body } = splitFrontmatter(source);
  if (rawFrontmatter === undefined) return { body };
  // Normalize delimiters and require a full closing line: ---foo is a YAML key.
  const parsed = matter(`---\n${rawFrontmatter}---\n`, { delimiters: ['---', '---\n'], engines: { yaml: yamlEngine } });
  return { metadata: parsed.data, body };
}

/** Serialize values without preserving YAML comments or presentation. */
export function serializeDocument(document: MarkdownDocument<string>, originalSource?: string): string {
  const bom = originalSource?.startsWith('\uFEFF') ? '\uFEFF' : '';
  let prefix = '';
  if (document.metadata !== undefined) {
    const metadata = readValue(document.metadata);
    if (!isRecord(metadata) || document.metadata instanceof Map) throw new Error('Frontmatter must be a mapping.');
    // gray-matter.stringify trims dumped YAML and adds a body newline. Dump the
    // header directly so multiline field values and opaque body bytes stay intact.
    const yaml = dump(metadata, { schema: CORE_SCHEMA, lineWidth: -1, noRefs: true });
    prefix = `---\n${yaml}${yaml.endsWith('...\n') ? '' : '---\n'}`;
  }
  const result = bom + prefix + document.body;
  if (!sameValue(parseDocument(result), { metadata: document.metadata, body: document.body })) {
    throw new Error('Document cannot represent the requested metadata and body.');
  }
  return result;
}
