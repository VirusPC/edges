import { useDraggable } from "@dnd-kit/core"
import { Ellipsis } from "lucide-react"
import { useRef, useState } from "react"
import { itemPriority } from "../filter.ts"
import {
  priorityBadgeClass,
  reviewItemTitle,
  shortUpdated,
} from "../display.ts"
import type { ReviewGroup, ReviewItem } from "../types.ts"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu.tsx"

const STEM_HOLD_MS = 450

export function TaskCard({
  item,
  groups,
  narrow,
  selected,
  onSelect,
  onMove,
}: {
  item: ReviewItem
  groups: ReviewGroup[]
  narrow: boolean
  selected: boolean
  onSelect: (stem: string) => void
  onMove: (stem: string, projectId: string) => void
}) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: item.stem })
  const [picking, setPicking] = useState(false)
  const [stemOpen, setStemOpen] = useState(false)
  const holdTimer = useRef<number | null>(null)
  const held = useRef(false)
  const title = reviewItemTitle(item)
  const projectTitle =
    groups.find((group) => group.id === item.suggested)?.title ?? item.suggested
  const priority = itemPriority(item)
  const updated = shortUpdated(item.doc?.metadata["edges-updated-at"] ?? "")
  const selectedClass = selected
    ? " border-solid border-[#5b9fd4] ring-1 ring-[#5b9fd4]/50"
    : " border-[#334155] hover:border-[#5b9fd4]/70"

  function clearHold() {
    if (holdTimer.current !== null) {
      window.clearTimeout(holdTimer.current)
      holdTimer.current = null
    }
  }

  return (
    <div
      ref={setNodeRef}
      data-stem={item.stem}
      data-selected={selected ? "on" : undefined}
      className={
        "group flex w-full gap-1 rounded-lg border bg-[#1a2332] p-3 text-left shadow-sm" +
        selectedClass
      }
    >
      <div
        data-card-body={item.stem}
        className="flex min-w-0 flex-1 cursor-grab flex-col gap-2 active:cursor-grabbing"
        {...listeners}
        {...attributes}
        onClick={() => {
          if (held.current) {
            held.current = false
            return
          }
          onSelect(item.stem)
        }}
        onPointerDown={(event) => {
          listeners?.onPointerDown?.(event)
          if (!narrow) return
          held.current = false
          clearHold()
          holdTimer.current = window.setTimeout(() => {
            held.current = true
            setStemOpen(true)
          }, STEM_HOLD_MS)
        }}
        onPointerUp={(event) => {
          listeners?.onPointerUp?.(event)
          clearHold()
        }}
        onPointerCancel={clearHold}
        onPointerLeave={clearHold}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm leading-snug font-medium text-[#e7ecf3]">
            {title}
          </span>
          {priority !== "none" ? (
            <span
              className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] leading-none ${priorityBadgeClass(priority)}`}
            >
              {priority}
            </span>
          ) : null}
        </div>
        <div className="flex items-center justify-between gap-2 text-xs text-[#9aa8bc]">
          <span data-project-tag="true" className="truncate">
            {projectTitle}
          </span>
          {updated !== "" ? (
            <time data-updated="true" className="shrink-0 tabular-nums">
              {updated}
            </time>
          ) : null}
        </div>
        <span
          data-card-stem={item.stem}
          className={
            "truncate font-mono text-[10px] leading-none text-[#9aa8bc]/50 " +
            (stemOpen ? "block" : "hidden md:group-hover:block")
          }
        >
          {item.stem}
        </span>
        {narrow ? (
          <button
            type="button"
            className="self-start text-[10px] text-[#9aa8bc]/60"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation()
              setStemOpen((open) => !open)
            }}
          >
            {stemOpen ? "收起标识" : "标识"}
          </button>
        ) : null}
      </div>
      <DropdownMenu
        onOpenChange={(open) => {
          if (!open) setPicking(false)
        }}
      >
        <DropdownMenuTrigger
          aria-label="卡片菜单"
          className="shrink-0 self-start rounded-md p-1 text-[#9aa8bc] hover:bg-[#243044] hover:text-[#e7ecf3]"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          <Ellipsis className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {picking ? (
            groups.map((group) => (
              <DropdownMenuItem
                key={group.id}
                onSelect={() => onMove(item.stem, group.id)}
              >
                {group.title}
              </DropdownMenuItem>
            ))
          ) : (
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault()
                setPicking(true)
              }}
            >
              移到项目…
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
