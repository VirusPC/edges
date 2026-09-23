import type { ReviewPriority, ReviewStatus } from "./statuses.ts";

export type TaskDoc = {
  name: string;
  description: string;
  metadata: Record<string, string>;
  body: string;
};

export type ReviewItem = {
  stem: string;
  current: string;
  suggested: string;
  title?: string;
  description?: string;
  note?: string;
  status?: string;
  priority?: string;
  doc?: TaskDoc;
};

export type ReviewGroup = {
  id: string;
  title: string;
  description?: string;
};

export type ReviewPayload = {
  groups: ReviewGroup[];
  items: ReviewItem[];
};

export type ReviewHashState = {
  q: string;
  priority: "all" | ReviewPriority;
  assignee: string;
  status: "all" | ReviewStatus;
  projectId: string;
  stem: string;
};
