/** Historical AGENTS Task Project indexing is retired by ADR 0052. */
export interface TaskIndexMigrationPlan {
  root: string;
  tasks: string[];
  edits: Array<{ path: string; before: string | null; after: string }>;
}
export async function planTaskIndexes(_root: string): Promise<TaskIndexMigrationPlan> {
  throw new Error("The Task Project index migration is retired; use the recursive Project migration instead.");
}
export async function applyTaskIndexes(_plan: TaskIndexMigrationPlan): Promise<void> {
  throw new Error("The Task Project index migration is retired; use the recursive Project migration instead.");
}
