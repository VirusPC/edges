import type { Metadata, MetadataValue, MarkdownDocument } from '../document-model.js';
import { Document, isMap, isNode, isScalar, isSeq, parseDocument as parseYaml } from 'yaml';

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

/** Convert YAML maps without coercing keys; reject values outside the public model. */
function readValue(value: unknown, ancestors = new Set<object>(), fromYaml = false): MetadataValue {
  if (fromYaml && typeof value === 'bigint') {
    if (value > BigInt(Number.MAX_SAFE_INTEGER) || value < BigInt(Number.MIN_SAFE_INTEGER)) throw new Error('YAML integer cannot be represented as a safe JSON number.');
    return Number(value);
  }
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (!value || typeof value !== 'object' || ancestors.has(value)) throw new Error('Frontmatter must contain finite, acyclic JSON-compatible values.');
  ancestors.add(value);
  try {
    if (Array.isArray(value)) return value.map(item => readValue(item, ancestors, fromYaml));
    if (value instanceof Map) {
      for (const key of value.keys()) if (typeof key !== 'string') throw new Error('Frontmatter mapping keys must be strings.');
      return Object.fromEntries([...value].map(([key, item]) => [key, readValue(item, ancestors, fromYaml)]));
    }
    if (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null) {
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, readValue(item, ancestors, fromYaml)]));
    }
    throw new Error('Unsupported frontmatter value.');
  } finally { ancestors.delete(value); }
}

function isRecord(value: MetadataValue): value is Metadata { return value !== null && typeof value === 'object' && !Array.isArray(value); }

function readHeader(raw: string) {
  const yaml = parseYaml(raw, { version: '1.2', schema: 'core', uniqueKeys: true, intAsBigInt: true });
  if (yaml.errors.length || yaml.warnings.length) throw new Error(`Invalid YAML frontmatter: ${[...yaml.errors, ...yaml.warnings].map(error => error.message).join('; ')}`);
  if (yaml.contents !== null && !isMap(yaml.contents)) throw new Error('Frontmatter must be a mapping.');
  const metadata = readValue(yaml.toJS({ mapAsMap: true, maxAliasCount: 100 }) ?? {}, new Set(), true);
  if (!isRecord(metadata)) throw new Error('Frontmatter must be a mapping.');
  return { yaml, metadata };
}

/** Optional YAML metadata plus opaque Markdown; no domain rules or IO. */
export function parseDocument(source: string): MarkdownDocument {
  const { rawFrontmatter, body } = splitFrontmatter(source);
  return rawFrontmatter === undefined ? { body } : { metadata: readHeader(rawFrontmatter).metadata, body };
}

/** Mutate only changed YAML nodes, retaining untouched comments/styles/order. */
function reconcile(yaml: Document, path: (string | number)[], before: MetadataValue, after: MetadataValue): void {
  if (sameValue(before, after)) return;
  const node = yaml.getIn(path, true);
  if (isMap(node) && isRecord(before) && isRecord(after)) {
    for (const key of Object.keys(before)) if (!Object.hasOwn(after, key)) yaml.deleteIn([...path, key]);
    for (const [key, value] of Object.entries(after)) {
      if (Object.hasOwn(before, key)) reconcile(yaml, [...path, key], before[key], value);
      else yaml.setIn([...path, key], yaml.createNode(value));
    }
  } else if (isSeq(node) && Array.isArray(before) && Array.isArray(after)) {
    const previousNodes = [...node.items];
    const used = new Set<number>();
    const matches = after.map(value => {
      const index = before.findIndex((old, i) => !used.has(i) && sameValue(old, value));
      if (index >= 0) used.add(index);
      return index;
    });
    // Reuse unchanged occurrences first, then edit unmatched items in place.
    const origins = matches.map((match, index) => {
      if (match >= 0) return match;
      if (index < before.length && !used.has(index)) { used.add(index); return index; }
      return -1;
    });
    node.items = origins.map((origin, index) => origin >= 0 ? previousNodes[origin] : yaml.createNode(after[index]));
    origins.forEach((origin, index) => {
      if (origin >= 0) reconcile(yaml, [...path, index], before[origin], after[index]);
    });
  } else if (isScalar(node) && (after === null || typeof after !== 'object')) {
    node.value = after;
  } else {
    const replacement = yaml.createNode(after);
    if (isNode(node)) {
      replacement.comment = node.comment;
      replacement.commentBefore = node.commentBefore;
      replacement.spaceBefore = node.spaceBefore;
      if ('anchor' in node && 'anchor' in replacement) replacement.anchor = node.anchor;
    }
    yaml.setIn(path, replacement);
  }
}

/** Exact unchanged round trips; verify edited output before returning. */
export function serializeDocument(document: MarkdownDocument, originalSource?: string): string {
  const original = splitFrontmatter(originalSource ?? '');
  const header = original.rawFrontmatter === undefined ? undefined : readHeader(original.rawFrontmatter);
  let prefix = '';
  if (document.metadata !== undefined) {
    const metadata = readValue(document.metadata);
    if (!isRecord(metadata) || document.metadata instanceof Map) throw new Error('Frontmatter must be a mapping.');
    if (header && sameValue(header.metadata, metadata)) prefix = original.prefix;
    else {
      const newline = originalSource?.includes('\r\n') ? '\r\n' : '\n';

      const yaml: Document = header?.yaml ?? new Document({});
      if (yaml.contents === null) yaml.contents = yaml.createNode({});
      reconcile(yaml, [], header?.metadata ?? {}, metadata);
      prefix = `---${newline}${yaml.toString({ lineWidth: 0, flowCollectionPadding: false }).replace(/\n/g, newline)}---${newline}`;
    }
  }
  if (prefix && document.body && !prefix.endsWith('\n')) prefix += originalSource?.includes('\r\n') ? '\r\n' : '\n';
  const result = original.bom + prefix + document.body;
  if (!sameValue(parseDocument(result), document)) throw new Error('Document cannot be represented losslessly with the requested metadata and body.');
  return result;
}
