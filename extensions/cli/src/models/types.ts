export type Metadata = Record<string, unknown>;
export type ChildKind = 'local' | 'descendant';
export interface NodeReference {
  target: string;
  label?: string;
  description?: string;
  kind?: ChildKind;
}
export interface ScopeTraversalOptions { includeDescendants?: boolean }
export interface InternalContent {
  readonly constraints: readonly string[];
  readonly localMemory: readonly Readonly<NodeReference>[];
  readonly descendantMemory: readonly Readonly<NodeReference>[];
}
export type { TaskStatus, TaskPriority } from '../tasks/utils/types.js';
