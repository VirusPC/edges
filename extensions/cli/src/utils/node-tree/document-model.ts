/** Shared document data; no YAML syntax, AST, file location or domain schema. */
export type MetadataValue = string | number | boolean | null | MetadataValue[] | Metadata;
export interface Metadata { [key: string]: MetadataValue }

/** Document handling family, distinct from Memory content types such as project/feedback. */
export type DocumentType = 'base' | 'agents' | 'memory' | 'task';

/** A handling family may parse into its own model while sharing Markdown/YAML primitives. */
export interface DocumentCodec<TModel, TType extends string = DocumentType> {
  readonly type: TType;
  parse(source: string): TModel;
  serialize(model: TModel, originalSource?: string): string;
}

/** An authored identifier or link target; interpretation belongs to the caller. */
export interface DocumentReference {
  target: string;
  label?: string;
}

/** Tree context is caller-owned: Markdown serialization/parsing does not persist/rebuild it. */
export interface MarkdownDocument<TType extends string = DocumentType> {
  /** Optional processing hint; when omitted, the selected codec decides. Not written to YAML. */
  type?: TType;
  metadata?: Metadata;
  body: string;
  /** Optional identity within the caller's tree; not automatically persisted. */
  id?: string;
  /** Logical parent supplied by the caller, not inferred from filesystem ancestry. */
  parent?: DocumentReference;
  /** Ordered child references. Omitted means unspecified; [] means no children. */
  children?: DocumentReference[];
}
