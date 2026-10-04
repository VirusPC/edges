import { isDeepStrictEqual } from 'node:util';
import { decodeBody } from '../utils/node-tree/codec/parse.js';
import { serializeNode } from '../utils/node-tree/codec/serialize.js';
import type { NodeItem, NodeModel } from '../utils/node-tree/model.js';
import type { InternalContent, NodeReference } from './types.js';

// Existing type indexes use the same local ownership semantics, with different markers.
function adaptEntries(source: string): string {
  return source.replace(/^<!-- project-memory-entries:(start|end) -->$/gm, '<!-- project-memory-local:$1 -->');
}
function constraintText(item: NodeItem): string {
  return item.content.map(run => run.kind === 'text' ? run.value : run.label).join('');
}
function indexedReferences(item: NodeItem): NodeReference[] {
  return item.content.flatMap((run, index) => {
    if (run.kind !== 'link') return [];
    let suffix = '';
    for (let i = index + 1; i < item.content.length && item.content[i].kind === 'text'; i++) suffix += (item.content[i] as { value: string }).value;
    const description = suffix.replace(/^\s*[—–-]\s*/, '').trim();
    return [{ target: run.target, label: run.label, ...(description ? { description } : {}) }];
  });
}
function renderReference(reference: NodeReference): NodeItem {
  return { content: [
    { kind: 'link', target: reference.target, label: reference.label ?? reference.target },
    ...(reference.description === undefined ? [] : [{ kind: 'text' as const, value: ` — ${reference.description}` }]),
  ] };
}
function rebuildIndexes(original: NodeItem[], references: readonly Readonly<NodeReference>[], indexItems: ReadonlySet<NodeItem>): NodeItem[] {
  const remaining = [...references];
  const next: NodeItem[] = [];
  for (const item of original) {
    const before = indexItems.has(item) ? indexedReferences(item) : [];
    if (!before.length) { next.push(item); continue; }
    const selected = remaining.splice(0, before.length);
    const unchanged = isDeepStrictEqual(before, selected);
    if (before.length > 1 && !unchanged) throw new Error('Cannot edit a multi-link index item without changing surrounding authored text.');
    next.push(...(unchanged ? [item] : selected.map(renderReference)));
  }
  return [...next, ...remaining.map(renderReference)];
}

/** Immutable source snapshot used only to preserve unmodeled Markdown during edits. */
export class InternalSyntax {
  readonly #source: string;
  readonly #model: NodeModel;
  readonly #entries: boolean;
  readonly #indexItems = new Set<NodeItem>();
  constructor(source: string) {
    this.#entries = /^<!-- project-memory-entries:start -->$/m.test(source);
    this.#source = adaptEntries(source);
    const decoded = decodeBody(this.#source);
    this.#model = decoded.model;
    for (const key of ['memory', 'children'] as const) {
      decoded.bindings[key].forEach((binding, index) => {
        const itemSource = this.#source.slice(binding.start, binding.end);
        // Only list items carry index ownership; prose links remain source content.
        if (/^(?:[-+*]|\d+[.)])\s/.test(itemSource)) this.#indexItems.add(this.#model[key][index]);
      });
    }
  }
  content(): InternalContent {
    return {
      constraints: this.#model.constraints.map(constraintText),
      localMemory: this.#model.memory.filter(item => this.#indexItems.has(item)).flatMap(indexedReferences),
      descendantMemory: this.#model.children.filter(item => this.#indexItems.has(item)).flatMap(indexedReferences),
    };
  }
  serialize(content: InternalContent): string {
    const originalConstraints = this.#model.constraints;
    const used = new Set<number>();
    const constraints = content.constraints.map(value => {
      const index = originalConstraints.findIndex((item, i) => !used.has(i) && constraintText(item) === value);
      if (index >= 0) { used.add(index); return originalConstraints[index]; }
      return { content: [{ kind: 'text' as const, value }] };
    });
    const model: NodeModel = {
      constraints,
      memory: rebuildIndexes(this.#model.memory, content.localMemory, this.#indexItems),
      children: rebuildIndexes(this.#model.children, content.descendantMemory, this.#indexItems),
      references: this.#model.references,
    };
    const rendered = serializeNode(model, this.#source);
    return this.#entries ? rendered.replace(/^<!-- project-memory-local:(start|end) -->$/gm, '<!-- project-memory-entries:$1 -->') : rendered;
  }
}
