import { REVIEW_PRIORITIES, type ReviewPriority, type ReviewStatus } from "./statuses.ts";
import type { ReviewItem } from "./types.ts";

export type { ReviewItem };

export type ReviewFilter = {
  q: string;
  priority: "all" | ReviewPriority;
  assignee: string;
  status: "all" | ReviewStatus;
  projectId: string;
};

function metadataValue(item: ReviewItem, key: string): string {
  const value = item.doc?.metadata[key];
  return typeof value === "string" ? value : "";
}

export function itemStatus(item: ReviewItem): string {
  const fromDoc = metadataValue(item, "edges-tasks-status");
  if (fromDoc !== "") {
    return fromDoc;
  }
  return item.status ?? "";
}

export function itemPriority(item: ReviewItem): ReviewPriority {
  const fromDoc = metadataValue(item, "edges-task-priority");
  if (fromDoc !== "" && (REVIEW_PRIORITIES as readonly string[]).includes(fromDoc)) {
    return fromDoc as ReviewPriority;
  }
  if (item.priority !== undefined && (REVIEW_PRIORITIES as readonly string[]).includes(item.priority)) {
    return item.priority as ReviewPriority;
  }
  return "none";
}

export function itemAssignee(item: ReviewItem): string {
  return metadataValue(item, "edges-task-assignee");
}

export function itemSearchText(item: ReviewItem): string {
  return [item.title, item.description, item.doc?.name, item.doc?.description, item.doc?.body]
    .map((part) => part ?? "")
    .join("\n")
    .toLowerCase();
}

export function matchesReviewFilter(item: ReviewItem, filter: ReviewFilter): boolean {
  if (filter.projectId !== "all" && item.suggested !== filter.projectId) {
    return false;
  }
  if (filter.status !== "all" && itemStatus(item) !== filter.status) {
    return false;
  }
  if (filter.priority !== "all" && itemPriority(item) !== filter.priority) {
    return false;
  }
  if (filter.assignee !== "" && itemAssignee(item) !== filter.assignee) {
    return false;
  }
  if (filter.q !== "" && !itemSearchText(item).includes(filter.q.toLowerCase())) {
    return false;
  }
  return true;
}
