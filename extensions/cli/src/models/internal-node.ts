import { BaseNode } from './base-node.js';
import { InternalSyntax } from './internal-syntax.js';
import { validateChild } from './relations.js';
import type { ChildKind, InternalContent, NodeReference } from './types.js';

type Content = { constraints: string[]; localMemory: NodeReference[]; descendantMemory: NodeReference[] };
const section = (kind: ChildKind) => kind === 'local' ? 'localMemory' : 'descendantMemory';
function entry(reference: NodeReference): NodeReference {
  const { kind: _kind, ...value } = reference;
  return structuredClone(value);
}

export class InternalNode extends BaseNode<'internal'> {
  override readonly type = 'internal' as const;
  #content: Content = { constraints: [], localMemory: [], descendantMemory: [] };
  #syntax = new InternalSyntax('');
  get content(): InternalContent { return structuredClone(this.#content); }
  override get children(): readonly Readonly<NodeReference>[] {
    return [
      ...this.#content.localMemory.map(reference => ({ ...reference, kind: 'local' as const })),
      ...this.#content.descendantMemory.map(reference => ({ ...reference, kind: 'descendant' as const })),
    ];
  }
  protected override parseBody(markdown: string): void {
    const syntax = new InternalSyntax(markdown);
    const content = syntax.content();
    this.#content = { constraints: [...content.constraints], localMemory: [...content.localMemory], descendantMemory: [...content.descendantMemory] };
    this.#syntax = syntax;
  }
  protected override serializeBody(): string { return this.#syntax.serialize(this.#content); }
  #replaceContent(next: Content): void {
    // Validate representability before exposing any mutation to callers.
    this.#syntax.serialize(next);
    this.#content = next;
  }
  setConstraints(items: readonly string[]): void {
    this.#replaceContent({ ...this.#content, constraints: [...items] });
  }
  addChild(reference: NodeReference): void {
    validateChild(reference);
    if (this.children.some(child => child.target === reference.target)) throw new Error(`Child already indexed: ${reference.target}`);
    const next = structuredClone(this.#content);
    next[section(reference.kind!)].push(entry(reference));
    this.#replaceContent(next);
  }
  updateChild(reference: NodeReference): void {
    validateChild(reference);
    const previous = this.children.find(child => child.target === reference.target);
    if (!previous) throw new Error(`Child is not indexed: ${reference.target}`);
    const next = structuredClone(this.#content);
    const items = next[section(previous.kind!)];
    const index = items.findIndex(child => child.target === reference.target);
    if (previous.kind === reference.kind) items[index] = entry(reference);
    else { items.splice(index, 1); next[section(reference.kind!)].push(entry(reference)); }
    this.#replaceContent(next);
  }
  removeChild(reference: NodeReference): void {
    const next = structuredClone(this.#content);
    for (const key of ['localMemory', 'descendantMemory'] as const) next[key] = next[key].filter(child => child.target !== reference.target);
    this.#replaceContent(next);
  }
}
