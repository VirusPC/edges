import { useDroppable } from "@dnd-kit/core"
import { useState } from "react"
import {
  matchesReviewFilter,
  type ReviewFilter,
  type ReviewItem,
} from "../filter.ts"
import type { ReviewGroup } from "../types.ts"
import { SectionHeader } from "./SectionHeader.tsx"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "./ui/select.tsx"

function projectChoiceLabel(title: string, count: number): string {
  return `${title} · ${count}`
}

export function ProjectColumn({
  groups,
  items,
  filter,
  narrow,
  onSelect,
}: {
  groups: ReviewGroup[]
  items: ReviewItem[]
  filter: ReviewFilter
  narrow: boolean
  onSelect: (projectId: string) => void
}) {
  const topBar = { ...filter, projectId: "all" }
  const allCount = items.filter((item) =>
    matchesReviewFilter(item, topBar)
  ).length
  const choices = [
    { id: "all", title: "全部", count: allCount },
    ...groups.map((group) => ({
      id: group.id,
      title: group.title,
      count: items.filter((item) =>
        matchesReviewFilter(item, { ...filter, projectId: group.id })
      ).length,
    })),
  ]
  const selected =
    choices.find((choice) => choice.id === filter.projectId) ?? choices[0]
  const [collapsed, setCollapsed] = useState(false)
  return (
    <nav
      data-review-projects="edges"
      className="w-full min-w-0 shrink-0 bg-[#0f1419] md:min-h-0 md:overflow-auto"
    >
      <SectionHeader
        section="projects"
        collapsed={collapsed}
        onToggle={() => setCollapsed((value) => !value)}
      />
      {collapsed ? null : (
        <div className="p-2">
          {narrow ? (
        <Select value={filter.projectId} onValueChange={onSelect}>
          <SelectTrigger
            data-project-select="edges"
            aria-label="项目"
            className="mb-1 h-9 w-full bg-[#1a2332]"
          >
            <span className="truncate">
              {selected
                ? projectChoiceLabel(selected.title, selected.count)
                : "全部 · 0"}
            </span>
          </SelectTrigger>
          <SelectContent>
            {choices.map((choice) => (
              <SelectItem key={choice.id} value={choice.id}>
                {projectChoiceLabel(choice.title, choice.count)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <ProjectList
          groups={groups}
          items={items}
          filter={filter}
          allCount={allCount}
          onSelect={onSelect}
        />
          )}
        </div>
      )}
    </nav>
  )
}

function ProjectList({
  groups,
  items,
  filter,
  allCount,
  onSelect,
}: {
  groups: ReviewGroup[]
  items: ReviewItem[]
  filter: ReviewFilter
  allCount: number
  onSelect: (projectId: string) => void
}) {
  return (
    <div data-project-list="edges">
      <ProjectRow
        id="all"
        title="全部"
        description=""
        droppable="0"
        selected={filter.projectId === "all"}
        count={allCount}
        onSelect={onSelect}
      />
      {groups.map((group) => (
        <ProjectDropRow
          key={group.id}
          id={group.id}
          title={group.title}
          description={group.description ?? ""}
          selected={filter.projectId === group.id}
          count={
            items.filter((item) =>
              matchesReviewFilter(item, { ...filter, projectId: group.id })
            ).length
          }
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

function projectRowClass(selected: boolean, over = false): string {
  const layout =
    "group mb-1 flex w-full items-start justify-between gap-3 rounded-lg border px-2.5 py-2 text-left text-sm text-[#e7ecf3]"
  const state = selected
    ? "border-solid border-[#5b9fd4] bg-[#1a2332] opacity-100"
    : "border-transparent opacity-60 hover:opacity-100"
  const overClass = over
    ? " outline outline-2 outline-offset-[3px] outline-[#5b9fd4]"
    : ""
  return `${layout} ${state}${overClass}`
}

function CountBadge({ count }: { count: number }) {
  return (
    <span className="shrink-0 rounded-full bg-[#0f1419] px-2 py-0.5 text-xs text-[#9aa8bc] tabular-nums">
      {count}
    </span>
  )
}

function ProjectDropRow({
  id,
  title,
  description,
  selected,
  count,
  onSelect,
}: {
  id: string
  title: string
  description: string
  selected: boolean
  count: number
  onSelect: (projectId: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `project:${id}` })
  const [open, setOpen] = useState(false)
  return (
    <button
      type="button"
      ref={setNodeRef}
      data-project-id={id}
      data-droppable="1"
      data-droppable-id={`project:${id}`}
      data-filter={selected ? "on" : undefined}
      className={projectRowClass(selected, isOver)}
      onClick={() => onSelect(id)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <ProjectLabel title={title} description={description} open={open} />
      <CountBadge count={count} />
    </button>
  )
}

function ProjectLabel({
  title,
  description,
  open,
}: {
  title: string
  description: string
  open: boolean
}) {
  const text = description.trim()
  return (
    <span className="min-w-0 flex-1">
      <span className="block truncate">{title}</span>
      {text !== "" ? (
        <span
          className={`${open ? "mt-1 block" : "hidden"} text-xs leading-snug font-normal whitespace-normal text-[#9aa8bc]`}
        >
          {text}
        </span>
      ) : null}
    </span>
  )
}

function ProjectRow({
  id,
  title,
  description,
  droppable,
  selected,
  count,
  onSelect,
}: {
  id: string
  title: string
  description: string
  droppable: "0" | "1"
  selected: boolean
  count: number
  onSelect: (projectId: string) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <button
      type="button"
      data-project-id={id}
      data-droppable={droppable}
      data-filter={selected ? "on" : undefined}
      className={projectRowClass(selected)}
      onClick={() => onSelect(id)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <ProjectLabel title={title} description={description} open={open} />
      <CountBadge count={count} />
    </button>
  )
}
