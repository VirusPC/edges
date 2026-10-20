import { describe, expect, it } from "vitest";
import { itemPriority, itemStatus, matchesReviewFilter, type ReviewFilter, type ReviewItem } from "../src/filter.ts";

const base: ReviewItem = {
  stem: "2026-09-21--alpha",
  current: "default",
  suggested: "cli",
  title: "Alpha title",
  description: "short",
  status: "todo",
  priority: "low",
  doc: {
    name: "alpha-name",
    description: "doc-desc",
    metadata: {
      "edges-tasks-status": "in_progress",
      "edges-task-priority": "high",
      "edges-task-assignee": "Ada",
      "edges-updated-at": "2026-09-21T00:00:00.000Z",
    },
    body: "Body mentions Vite",
  },
};

const all: ReviewFilter = { q: "", priority: "all", assignee: "", status: "all", projectId: "all" };

describe("matchesReviewFilter", () => {
  it("prefers doc metadata for status and priority", () => {
    expect(itemStatus(base)).toBe("in_progress");
    expect(itemPriority(base)).toBe("high");
    expect(matchesReviewFilter(base, { ...all, status: "todo" })).toBe(false);
    expect(matchesReviewFilter(base, { ...all, status: "in_progress" })).toBe(true);
    expect(matchesReviewFilter(base, { ...all, priority: "low" })).toBe(false);
    expect(matchesReviewFilter(base, { ...all, priority: "high" })).toBe(true);
  });

  it("treats a missing priority as none and reads assignee only from doc", () => {
    const bare: ReviewItem = { stem: "s", current: "default", suggested: "default", title: "T" };
    expect(itemPriority(bare)).toBe("none");
    expect(matchesReviewFilter(bare, { ...all, priority: "none" })).toBe(true);
    expect(matchesReviewFilter(bare, { ...all, assignee: "Ada" })).toBe(false);
    expect(matchesReviewFilter(base, { ...all, assignee: "Ada" })).toBe(true);
  });

  it("searches title, description, and doc text, not the stem", () => {
    expect(matchesReviewFilter(base, { ...all, q: "vite" })).toBe(true);
    expect(matchesReviewFilter(base, { ...all, q: "alpha title" })).toBe(true);
    expect(matchesReviewFilter(base, { ...all, q: "2026-09-21--alpha" })).toBe(false);
  });

  it("filters by suggested project", () => {
    expect(matchesReviewFilter(base, { ...all, projectId: "cli" })).toBe(true);
    expect(matchesReviewFilter(base, { ...all, projectId: "default" })).toBe(false);
  });
});
