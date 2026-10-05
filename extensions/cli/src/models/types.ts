export type Metadata = Record<string, unknown>;
export type ChildGroup = "local" | "descendant";
export interface NodeReference {
  id: string;
  name?: string;
  description?: string;
}
export interface NodeCreateInput {
  name?: string;
  description?: string;
  metadata?: Metadata;
  body?: string;
}
export interface NodeUpdateInput extends NodeCreateInput {}
export interface NodeContext {
  operation: "create" | "update" | "destroy";
  parent?: NodeReference;
}
export interface InternalCreateInput extends NodeCreateInput {
  constraints?: readonly string[];
  localChildren?: readonly NodeReference[];
  descendantChildren?: readonly NodeReference[];
}
export interface InternalUpdateInput extends InternalCreateInput {}
export interface TaskCreateInput extends NodeCreateInput {
  title?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee?: string;
}
export interface TaskUpdateInput extends TaskCreateInput {}
export interface MemoryCreateInput extends NodeCreateInput {
  memoryType?: string;
}
export interface MemoryUpdateInput extends MemoryCreateInput {}
export interface ScopeTraversalOptions {
  includeDescendants?: boolean;
}
export interface InternalContent {
  readonly constraints: readonly string[];
  readonly localChildren: readonly Readonly<NodeReference>[];
  readonly descendantChildren: readonly Readonly<NodeReference>[];
}
import type { TaskStatus, TaskPriority } from "./tasks/types.js";
export type { TaskStatus, TaskPriority } from "./tasks/types.js";
