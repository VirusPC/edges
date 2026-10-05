import { expect, it } from "vitest";
import { buildReviewHash, parseReviewHash } from "../src/hash.ts";

it("round-trips hash search params and drops defaults", () => {
  const hash = buildReviewHash({
    q: "vite",
    priority: "high",
    assignee: "Ada",
    status: "todo",
    projectId: "cli",
    stem: "2026-09-21--alpha",
  });
  expect(hash.startsWith("#?")).toBe(true);
  expect(hash.includes("#/")).toBe(false);
  const parsed = parseReviewHash(hash);
  expect(parsed).toEqual({
    q: "vite",
    priority: "high",
    assignee: "Ada",
    status: "todo",
    projectId: "cli",
    stem: "2026-09-21--alpha",
  });
  expect(buildReviewHash({
    q: "",
    priority: "all",
    assignee: "",
    status: "all",
    projectId: "all",
    stem: "",
  })).toBe("#?");
});

it("treats an unknown status as all", () => {
  expect(parseReviewHash("#?status=nope").status).toBe("all");
});
