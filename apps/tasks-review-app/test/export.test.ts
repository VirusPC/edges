import { expect, it } from "vitest";
import { applyProjectDrop, exportReviewRows } from "../src/export.ts";
import type { ReviewItem } from "../src/types.ts";

const items: ReviewItem[] = [{
  stem: "2026-09-21--alpha",
  current: "default",
  suggested: "default",
  status: "todo",
  note: "",
}];

it("copies keep or move without a status field", () => {
  expect(exportReviewRows(items)[0]).toEqual({
    stem: "2026-09-21--alpha",
    current: "default",
    suggested: "default",
    action: "keep",
    note: "",
  });
  const moved = applyProjectDrop(items, "2026-09-21--alpha", "cli");
  expect(moved[0]?.suggested).toBe("cli");
  expect(moved[0]?.current).toBe("default");
  expect(moved[0]?.status).toBe("todo");
  expect(exportReviewRows(moved)[0]?.action).toBe("move");
  expect("status" in exportReviewRows(moved)[0]!).toBe(false);
});
