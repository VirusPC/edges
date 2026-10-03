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

it('source-aware duplicate stems move independently and cannot cross boards; export retains real project', () => {
  const source = { scope: '.', purpose: 'domain' as const };
  const other = { scope: '.', purpose: 'maintenance' as const };
  const groups = [
    { id: 'd-default', project: 'default', source, title: 'Default' },
    { id: 'd-cli', project: 'cli', source, title: 'CLI' },
    { id: 'm-cli', project: 'cli', source: other, title: 'Maintenance' },
  ];
  const duplicated = [
    { id: 'd-task', stem: 'same', current: 'd-default', suggested: 'd-default', project: 'default', source },
    { id: 'm-task', stem: 'same', current: 'm-cli', suggested: 'm-cli', project: 'cli', source: other },
  ];
  expect(applyProjectDrop(duplicated, 'd-task', 'm-cli', groups)).toEqual(duplicated);
  const moved = applyProjectDrop(duplicated, 'd-task', 'd-cli', groups);
  expect(moved[0]?.suggested).toBe('d-cli');
  expect(moved[1]).toEqual(duplicated[1]);
  expect(exportReviewRows(moved, groups)[0]).toMatchObject({ stem: 'same', current: 'default', suggested: 'cli', source, action: 'move' });
});
