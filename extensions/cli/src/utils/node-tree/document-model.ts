/** Shared document data; no YAML syntax, AST, file location or domain schema. */
export type MetadataValue = string | number | boolean | null | MetadataValue[] | Metadata;
export interface Metadata { [key: string]: MetadataValue }

/** An authored identifier or link target; interpretation belongs to the caller. */
export interface DocumentReference {
  target: string;
  label?: string;
}

/** Tree context is caller-owned: Markdown serialization/parsing does not persist/rebuild it. */
export interface MarkdownDocument {
  metadata?: Metadata;
  body: string;
  /** Optional identity within the caller's tree; not automatically persisted. */
  id?: string;
  /** Logical parent supplied by the caller, not inferred from filesystem ancestry. */
  parent?: DocumentReference;
  /** Ordered child references. Omitted means unspecified; [] means no children. */
  children?: DocumentReference[];
}
