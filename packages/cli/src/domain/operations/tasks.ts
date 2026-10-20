import { compareTaskPriority } from '../models/tasks/priority.js';
import type { TaskPriority, TaskProjectId } from '../models/tasks/types.js';

export function filterTasksByPriority<T extends { priority: TaskPriority }>(
  items: T[],
  allowed: readonly TaskPriority[],
): T[] {
  if (allowed.length === 0) {
    return items;
  }
  const set = new Set(allowed);
  return items.filter((item) => set.has(item.priority));
}

export function sortTasksByPriority<T extends { priority: TaskPriority }>(items: T[]): T[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((left, right) => {
      const byRank = compareTaskPriority(left.item.priority, right.item.priority);
      return byRank !== 0 ? byRank : left.index - right.index;
    })
    .map((entry) => entry.item);
}

export function filterTasksByProject<T extends { project: TaskProjectId }>(
  items: T[],
  allowed: readonly TaskProjectId[],
): T[] {
  if (allowed.length === 0) {
    return items;
  }
  const set = new Set(allowed);
  return items.filter((item) => set.has(item.project));
}
