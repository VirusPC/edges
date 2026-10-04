/** Shared document data; no YAML syntax, AST, file location or domain schema. */
export type MetadataValue = string | number | boolean | null | MetadataValue[] | Metadata;
export interface Metadata { [key: string]: MetadataValue }
export interface MarkdownDocument { metadata?: Metadata; body: string }
