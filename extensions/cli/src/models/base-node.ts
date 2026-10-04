import { isAbsolute } from 'node:path';
import { parseDocument, serializeDocument } from '../utils/markdown/document.js';
import { nodeRelations } from './relations.js';
import type { Metadata, NodeReference } from './types.js';

export class BaseNode<TType extends string = string> {
  readonly path: string;
  readonly type: TType = 'base' as TType;
  #metadata: Metadata | undefined;
  #body = '';

  constructor(path: string) {
    if (!isAbsolute(path)) throw new Error('Node path must be absolute.');
    this.path = path;
  }
  get id(): string | undefined { return typeof this.#metadata?.id === 'string' ? this.#metadata.id : undefined; }
  get parent(): Readonly<NodeReference> | undefined { return nodeRelations(this).parent; }
  get children(): readonly Readonly<NodeReference>[] | undefined { return nodeRelations(this).children; }
  get metadata(): Readonly<Metadata> | undefined { return structuredClone(this.#metadata); }
  get body(): string { return this.serializeBody(); }
  set body(markdown: string) { this.parseBody(markdown); }
  parse(markdown: string): this {
    const document = parseDocument(markdown);
    this.validateMetadata(document.metadata);
    this.parseBody(document.body);
    this.#metadata = structuredClone(document.metadata);
    return this;
  }
  serialize(): string { return serializeDocument({ metadata: this.#metadata, body: this.serializeBody() }); }
  protected parseBody(markdown: string): void { this.#body = markdown; }
  protected serializeBody(): string { return this.#body; }
  protected validateMetadata(metadata: Metadata | undefined): void {
    if (metadata !== undefined && (!metadata || typeof metadata !== 'object' || Array.isArray(metadata))) throw new Error('Metadata must be a mapping.');
  }
  setMetadata(key: string, value: unknown): void {
    const next = { ...this.#metadata, [key]: structuredClone(value) };
    this.validateMetadata(next);
    this.#metadata = next;
  }
  removeMetadata(key: string): void {
    if (this.#metadata === undefined) return;
    const next = { ...this.#metadata };
    delete next[key];
    this.validateMetadata(next);
    this.#metadata = next;
  }
}
