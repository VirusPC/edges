import { dirname, isAbsolute, normalize } from "node:path";
import {
  parseDocument,
  serializeDocument,
} from "../utils/markdown/document.js";
import { nodeRelations, nodePath } from "./relations.js";
import type {
  Metadata,
  NodeReference,
  NodeCreateInput,
  NodeUpdateInput,
  NodeContext,
} from "./types.js";

export class BaseNode<
  CreateInput extends NodeCreateInput = NodeCreateInput,
  UpdateInput extends NodeUpdateInput = NodeUpdateInput,
> implements NodeReference {
  readonly type: string = "base";
  readonly #initialPath: string;
  #metadata: Metadata | undefined;
  #body = "";
  constructor(path: string) {
    if (!isAbsolute(path)) throw new Error("Node path must be absolute.");
    this.#initialPath = normalize(path);
  }
  get path(): string {
    return nodePath(this) ?? this.#initialPath;
  }
  get directoryPath(): string {
    return dirname(this.path);
  }
  get id(): string {
    return this.path;
  }
  get isLeaf(): boolean {
    return false;
  }
  get name(): string | undefined {
    return this.#metadata?.name as string | undefined;
  }
  set name(value: string | undefined) {
    if (value === undefined) this.removeMetadata("name");
    else this.setMetadata("name", value);
  }
  get description(): string | undefined {
    return this.#metadata?.description as string | undefined;
  }
  set description(value: string | undefined) {
    if (value === undefined) this.removeMetadata("description");
    else this.setMetadata("description", value);
  }
  get parent(): Readonly<NodeReference> | undefined {
    return nodeRelations(this).parent;
  }
  get harness(): Readonly<NodeReference> | undefined {
    return nodeRelations(this).harness;
  }
  get children(): readonly Readonly<NodeReference>[] {
    return [];
  }
  get metadata(): Readonly<Metadata> | undefined {
    return structuredClone(this.#metadata);
  }
  get body(): string {
    return this.serializeBody();
  }
  set body(markdown: string) {
    this.parseBody(markdown);
  }
  parse(markdown: string): this {
    try {
      const document = parseDocument(markdown);
      this.validateMetadata(document.metadata);
      this.parseBody(document.body);
      this.#metadata = structuredClone(document.metadata);
      return this;
    } catch (cause) {
      throw new Error(
        `${this.path}: ${cause instanceof Error ? cause.message : String(cause)}`,
        { cause },
      );
    }
  }
  serialize(): string {
    return serializeDocument({
      metadata: this.#metadata,
      body: this.serializeBody(),
    });
  }
  protected parseBody(markdown: string): void {
    this.#body = markdown;
  }
  protected serializeBody(): string {
    return this.#body;
  }
  protected validateMetadata(metadata: Metadata | undefined): void {
    if (
      metadata !== undefined &&
      (!metadata || typeof metadata !== "object" || Array.isArray(metadata))
    )
      throw new Error(`${this.path}: metadata must be a mapping.`);
    for (const field of ["name", "description"])
      if (
        metadata?.[field] !== undefined &&
        typeof metadata[field] !== "string"
      )
        throw new Error(`${this.path}: ${field} must be a string.`);
  }
  protected applyInput(input: NodeCreateInput): void {
    if (input.metadata !== undefined) {
      this.validateMetadata(input.metadata);
      this.#metadata = {
        ...this.#metadata,
        ...structuredClone(input.metadata),
      };
    }
    if ("name" in input) this.name = input.name;
    if ("description" in input) this.description = input.description;
    if (input.body !== undefined) this.body = input.body;
  }
  protected mutate(input: NodeCreateInput, fresh: boolean): this {
    const draft = new (this.constructor as new (path: string) => BaseNode)(
      this.path,
    );
    if (!fresh) {
      draft.#metadata = structuredClone(this.#metadata);
      draft.parseBody(this.serializeBody());
    }
    draft.applyInput(input);
    draft.validate();
    this.parseBody(draft.serializeBody());
    this.#metadata = structuredClone(draft.#metadata);
    return this;
  }
  create(input: CreateInput, _context: NodeContext): this {
    return this.mutate(input, true);
  }
  update(input: UpdateInput, _context: NodeContext): this {
    return this.mutate(input, false);
  }
  destroy(_context: NodeContext): void {
    this.validate();
    if (this.children.length)
      throw new Error(`${this.path}: cannot destroy node with children.`);
  }
  validate(): void {
    this.validateMetadata(this.#metadata);
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
