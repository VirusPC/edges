import type { TaskStatus, TaskPriority } from "./types.js";

/** JSON extension values are preserved by JSON input adapters. */
export type TaskJsonValue = string | number | boolean | null | TaskJsonValue[] | { [key: string]: TaskJsonValue };

export interface TaskMetadata {
  "edges-type"?: "task";
  /** Display title. Board title falls back to name, then the Task stem. */
  "edges-title"?: string;
  "edges-tasks-status"?: TaskStatus;
  /** Orthogonal to status. Absent reads as none. */
  "edges-task-priority"?: TaskPriority;
  "edges-task-assignee"?: string;
  /** @format date-time */
  "edges-updated-at"?: string;
  [key: string]: TaskJsonValue | undefined;
}

/**
 * @title Task Doc
 * @description Edges Task document contract. CLI frontmatter and a board item's optional doc align to this shape. Unknown metadata keys accept JSON values. body is Markdown, not precompiled HTML.
 */
export interface TaskDoc {
  /** Frontmatter name. Not the Task stem and not metadata.edges-title. */
  name: string;
  description: string;
  metadata: TaskMetadata;
  /** Markdown after frontmatter. */
  body: string;
}

