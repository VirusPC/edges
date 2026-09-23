import { itemStatus, matchesReviewFilter, type ReviewFilter, type ReviewItem } from "../filter.ts";
import { REVIEW_STATUS_COLUMNS } from "../statuses.ts";
import type { ReviewGroup } from "../types.ts";
import { TaskCard } from "./TaskCard.tsx";

export function StatusBoard({
  items,
  groups,
  filter,
  onSelect,
}: {
  items: ReviewItem[];
  groups: ReviewGroup[];
  filter: ReviewFilter;
  onSelect: (stem: string) => void;
}) {
  const visible = items.filter((item) => matchesReviewFilter(item, filter));
  const known = new Set<string>(REVIEW_STATUS_COLUMNS);
  const unspecified = visible.filter((item) => !known.has(itemStatus(item)));
  return (
    <div className="flex min-h-0 gap-2 overflow-auto p-2">
      {REVIEW_STATUS_COLUMNS.map((status) => {
        const columnItems = visible.filter((item) => itemStatus(item) === status);
        return (
          <section key={status} data-status-column={status} className="min-w-40">
            <h2>
              {status} {columnItems.length}
            </h2>
            {columnItems.map((item) => (
              <TaskCard key={item.stem} item={item} groups={groups} onSelect={onSelect} />
            ))}
          </section>
        );
      })}
      {unspecified.length > 0 ? (
        <section data-status-column="__unspecified" className="min-w-40">
          <h2>未标注 {unspecified.length}</h2>
          {unspecified.map((item) => (
            <TaskCard key={item.stem} item={item} groups={groups} onSelect={onSelect} />
          ))}
        </section>
      ) : null}
    </div>
  );
}
