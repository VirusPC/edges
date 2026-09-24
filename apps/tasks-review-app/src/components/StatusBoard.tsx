import { itemStatus, matchesReviewFilter, type ReviewFilter, type ReviewItem } from "../filter.ts";
import { statusDotClass } from "../display.ts";
import { REVIEW_STATUS_COLUMNS } from "../statuses.ts";
import type { ReviewGroup } from "../types.ts";
import { TaskCard } from "./TaskCard.tsx";

export function StatusBoard({
  items,
  groups,
  filter,
  selectedStem,
  onSelect,
  onMove,
}: {
  items: ReviewItem[];
  groups: ReviewGroup[];
  filter: ReviewFilter;
  selectedStem: string;
  onSelect: (stem: string) => void;
  onMove: (stem: string, projectId: string) => void;
}) {
  const visible = items.filter((item) => matchesReviewFilter(item, filter));
  const known = new Set<string>(REVIEW_STATUS_COLUMNS);
  const unspecified = visible.filter((item) => !known.has(itemStatus(item)));
  const columns = REVIEW_STATUS_COLUMNS.map((status) => ({
    status,
    title: status,
    items: visible.filter((item) => itemStatus(item) === status),
  })).filter((column) => column.items.length > 0);
  return (
    <div
      id="review-board"
      data-status-board="edges"
      className="flex w-full min-w-0 max-w-full shrink-0 gap-3 overflow-x-auto bg-[#0f1419] p-3 md:min-h-0 md:overflow-auto"
    >
      {columns.map((column) => (
        <section key={column.status} data-status-column={column.status} className="flex w-72 shrink-0 flex-col gap-2">
          <ColumnHeader title={column.title} count={column.items.length} dot={statusDotClass(column.status)} />
          {column.items.map((item) => (
            <TaskCard
              key={item.stem}
              item={item}
              groups={groups}
              selected={item.stem === selectedStem}
              onSelect={onSelect}
              onMove={onMove}
            />
          ))}
        </section>
      ))}
      {unspecified.length > 0 ? (
        <section data-status-column="__unspecified" className="flex w-72 shrink-0 flex-col gap-2">
          <ColumnHeader title="未标注" count={unspecified.length} dot={statusDotClass("__unspecified")} />
          {unspecified.map((item) => (
            <TaskCard
              key={item.stem}
              item={item}
              groups={groups}
              selected={item.stem === selectedStem}
              onSelect={onSelect}
              onMove={onMove}
            />
          ))}
        </section>
      ) : null}
      {visible.length === 0 ? (
        <p className="px-2 py-6 text-sm text-[#9aa8bc]">没有匹配的卡片</p>
      ) : null}
    </div>
  );
}

function ColumnHeader({ title, count, dot }: { title: string; count: number; dot: string }) {
  return (
    <h2 className="sticky top-0 flex items-center justify-between gap-2 bg-[#0f1419] px-1 py-1 text-base font-semibold tracking-wide text-[#9aa8bc]">
      <span className="flex items-center gap-2">
        <span className={`size-1.5 rounded-full ${dot}`} />
        {title}
      </span>
      <span className="rounded-full bg-[#1a2332] px-2 py-0.5 text-xs font-medium tabular-nums text-[#e7ecf3]">{count}</span>
    </h2>
  );
}
