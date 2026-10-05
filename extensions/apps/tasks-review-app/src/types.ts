import type { ReviewPriority, ReviewStatus } from "./statuses.ts";

export type TaskDoc = {
  name: string;
  description: string;
  metadata: Record<string, string>;
  body: string;
};

export type TaskSource = { scope: string; purpose: "domain" | "maintenance" };
export const itemIdentity = (item: ReviewItem): string => item.id ?? item.stem;

export type ReviewItem = {
  id?: string;
  source?: TaskSource;
  project?: string;
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
  source?: TaskSource;
  project?: string;
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
