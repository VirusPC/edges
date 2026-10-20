import { REVIEW_PRIORITIES, REVIEW_STATUS_COLUMNS, type ReviewPriority, type ReviewStatus } from "./statuses.ts";
import type { ReviewHashState } from "./types.ts";

export function parseReviewHash(hash: string): ReviewHashState {
  const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  const priority = params.get("priority") ?? "";
  const status = params.get("status") ?? "";
  return {
    q: params.get("q") ?? "",
    priority: (REVIEW_PRIORITIES as readonly string[]).includes(priority) ? priority as ReviewPriority : "all",
    assignee: params.get("assignee") ?? "",
    status: (REVIEW_STATUS_COLUMNS as readonly string[]).includes(status) ? status as ReviewStatus : "all",
    projectId: params.get("project") || "all",
    stem: params.get("stem") ?? "",
  };
}

export function buildReviewHash(state: ReviewHashState): string {
  const params = new URLSearchParams();
  if (state.q !== "") params.set("q", state.q);
  if (state.priority !== "all") params.set("priority", state.priority);
  if (state.assignee !== "") params.set("assignee", state.assignee);
  if (state.status !== "all") params.set("status", state.status);
  if (state.projectId !== "all") params.set("project", state.projectId);
  if (state.stem !== "") params.set("stem", state.stem);
  return `#?${params.toString()}`;
}

export function navigateReviewHash(href: string): void {
  window.history.pushState({}, "", href);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
