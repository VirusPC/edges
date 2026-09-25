import {
  itemStatus,
  matchesReviewFilter,
  type ReviewFilter,
  type ReviewItem,
} from "../filter.ts"
import { statusDotClass, statusLabel } from "../display.ts"
import { REVIEW_STATUS_COLUMNS } from "../statuses.ts"
import type { ReviewGroup } from "../types.ts"
import { useState } from "react"
import { SectionHeader } from "./SectionHeader.tsx"
import { TaskCard } from "./TaskCard.tsx"

export function StatusBoard({
  items,
  groups,
  filter,
  selectedStem,
  narrow,
  onSelect,
  onMove,
}: {
  items: ReviewItem[]
  groups: ReviewGroup[]
  filter: ReviewFilter
  selectedStem: string
  narrow: boolean
  onSelect: (stem: string) => void
  onMove: (stem: string, projectId: string) => void
}) {
  const visible = items.filter((item) => matchesReviewFilter(item, filter))
  const known = new Set<string>(REVIEW_STATUS_COLUMNS)
  const unspecified = visible.filter((item) => !known.has(itemStatus(item)))
  // Narrow sections: only non-empty statuses, all expanded. No collapse.
  const columns = REVIEW_STATUS_COLUMNS.map((status) => ({
    status,
    title: statusLabel(status),
    items: visible.filter((item) => itemStatus(item) === status),
  })).filter((column) => column.items.length > 0)
  const sectionClass = narrow
    ? "flex w-full min-w-0 flex-col gap-2"
    : "flex w-72 shrink-0 flex-col gap-2"
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div
      id="review-board"
      data-status-board="edges"
      className="flex w-full max-w-full min-w-0 shrink-0 flex-col bg-[#0f1419] md:h-full md:min-h-0 md:overflow-hidden"
    >
      <SectionHeader
        section="tasks"
        collapsed={collapsed}
        onToggle={() => setCollapsed((value) => !value)}
      />
      {collapsed ? null : (
      <div
        data-status-columns="edges"
        className={
          narrow
            ? "flex min-h-0 w-full min-w-0 flex-col gap-4 overflow-x-hidden p-3"
            : "flex min-h-0 w-full min-w-0 flex-1 gap-3 overflow-x-auto p-3"
        }
      >
        {columns.map((column) => (
          <section
            key={column.status}
            data-status-column={column.status}
            className={sectionClass}
          >
            <ColumnHeader
              title={column.title}
              count={column.items.length}
              dot={statusDotClass(column.status)}
              narrow={narrow}
            />
            {column.items.map((item) => (
              <TaskCard
                key={item.stem}
                item={item}
                groups={groups}
                narrow={narrow}
                selected={item.stem === selectedStem}
                onSelect={onSelect}
                onMove={onMove}
              />
            ))}
          </section>
        ))}
        {unspecified.length > 0 ? (
          <section data-status-column="__unspecified" className={sectionClass}>
            <ColumnHeader
              title="未标注"
              count={unspecified.length}
              dot={statusDotClass("__unspecified")}
              narrow={narrow}
            />
            {unspecified.map((item) => (
              <TaskCard
                key={item.stem}
                item={item}
                groups={groups}
                narrow={narrow}
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
      )}
    </div>
  )
}

function ColumnHeader({
  title,
  count,
  dot,
  narrow,
}: {
  title: string
  count: number
  dot: string
  narrow: boolean
}) {
  return (
    <h2
      className={
        (narrow ? "" : "sticky top-0 ") +
        "flex items-center justify-between gap-2 border-b border-[#334155] bg-[#0f1419] px-1 py-1 text-base font-semibold tracking-wide text-[#9aa8bc]"
      }
    >
      <span className="flex items-center gap-2">
        <span className={`size-1.5 rounded-full ${dot}`} />
        {title}
      </span>
      <span className="rounded-full bg-[#1a2332] px-2 py-0.5 text-xs font-medium text-[#e7ecf3] tabular-nums">
        {count}
      </span>
    </h2>
  )
}
