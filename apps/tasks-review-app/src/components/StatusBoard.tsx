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
  // Narrow sections: only non-empty statuses. Default expanded; each header can collapse.
  const columns = REVIEW_STATUS_COLUMNS.map((status) => ({
    status,
    title: statusLabel(status),
    items: visible.filter((item) => itemStatus(item) === status),
  })).filter((column) => column.items.length > 0)
  const sectionClass = narrow
    ? "flex w-full min-w-0 flex-col gap-2"
    : "flex w-72 shrink-0 flex-col gap-2"
  const [collapsed, setCollapsed] = useState(false)
  const [collapsedStatuses, setCollapsedStatuses] = useState<ReadonlySet<string>>(
    () => new Set()
  )
  const statusIds = [
    ...columns.map((column) => column.status),
    ...(unspecified.length > 0 ? ["__unspecified"] : []),
  ]
  const allStatusCollapsed =
    narrow &&
    statusIds.length > 0 &&
    statusIds.every((status) => collapsedStatuses.has(status))
  function toggleStatus(status: string) {
    setCollapsedStatuses((current) => {
      const next = new Set(current)
      if (next.has(status)) next.delete(status)
      else next.add(status)
      return next
    })
  }
  return (
    <div
      id="review-board"
      data-status-board="edges"
      className="flex w-full max-w-full min-w-0 shrink-0 flex-col bg-[#0f1419] md:h-full md:min-h-0 md:overflow-hidden"
    >
      <SectionHeader
        variant="chapter"
        section="tasks"
        toggleId="tasks"
        title="Tasks"
        collapsed={collapsed}
        onToggle={() => setCollapsed((value) => !value)}
      />
      {collapsed ? null : (
      <div
        data-status-columns="edges"
        data-status-stack={allStatusCollapsed ? "tight" : "spaced"}
        className={
          narrow
            ? "flex min-h-0 w-full min-w-0 flex-col overflow-x-clip " +
              (allStatusCollapsed ? "gap-0" : "gap-4")
            : "flex min-h-0 w-full min-w-0 flex-1 gap-3 overflow-x-auto p-3"
        }
      >
        {columns.map((column) => (
          <StatusSection
            key={column.status}
            status={column.status}
            title={column.title}
            dot={statusDotClass(column.status)}
            items={column.items}
            groups={groups}
            narrow={narrow}
            sectionClass={sectionClass}
            collapsed={collapsedStatuses.has(column.status)}
            onToggle={() => toggleStatus(column.status)}
            selectedStem={selectedStem}
            onSelect={onSelect}
            onMove={onMove}
          />
        ))}
        {unspecified.length > 0 ? (
          <StatusSection
            status="__unspecified"
            title={statusLabel("__unspecified")}
            dot={statusDotClass("__unspecified")}
            items={unspecified}
            groups={groups}
            narrow={narrow}
            sectionClass={sectionClass}
            collapsed={collapsedStatuses.has("__unspecified")}
            onToggle={() => toggleStatus("__unspecified")}
            selectedStem={selectedStem}
            onSelect={onSelect}
            onMove={onMove}
          />
        ) : null}
        {visible.length === 0 ? (
          <p className="px-2 py-6 text-sm text-[#9aa8bc]">没有匹配的卡片</p>
        ) : null}
      </div>
      )}
    </div>
  )
}

function StatusSection({
  status,
  title,
  dot,
  items,
  groups,
  narrow,
  sectionClass,
  collapsed,
  onToggle,
  selectedStem,
  onSelect,
  onMove,
}: {
  status: string
  title: string
  dot: string
  items: ReviewItem[]
  groups: ReviewGroup[]
  narrow: boolean
  sectionClass: string
  collapsed: boolean
  onToggle: () => void
  selectedStem: string
  onSelect: (stem: string) => void
  onMove: (stem: string, projectId: string) => void
}) {
  return (
    <section data-status-column={status} className={sectionClass}>
      <SectionHeader
        variant="status"
        toggleId={status}
        title={
          <>
            <span className={`size-1.5 shrink-0 rounded-full ${dot}`} />
            {title}
          </>
        }
        actions={
          <span className="shrink-0 rounded-full bg-[#0f1419] px-2 py-0.5 text-xs font-medium text-[#e7ecf3] tabular-nums">
            {items.length}
          </span>
        }
        collapsed={collapsed}
        onToggle={onToggle}
        stickyClassName={narrow ? "sticky top-12 z-10" : "sticky top-0 z-10"}
      />
      {collapsed ? null : (
        <div className={narrow ? "flex flex-col gap-2 px-3 py-3" : "contents"}>
          {items.map((item) => (
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
        </div>
      )}
    </section>
  )
}
