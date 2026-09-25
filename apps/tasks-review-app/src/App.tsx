import { DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react"
import { MarkdownPane } from "./components/MarkdownPane.tsx"
import { NavBar } from "./components/NavBar.tsx"
import { ProjectColumn } from "./components/ProjectColumn.tsx"
import { StatusBoard } from "./components/StatusBoard.tsx"
import { TopBar } from "./components/TopBar.tsx"
import { applyProjectDrop, projectIdFromDrop } from "./export.ts"
import { matchesReviewFilter, type ReviewFilter } from "./filter.ts"
import { buildReviewHash, navigateReviewHash, parseReviewHash } from "./hash.ts"
import type {
  ReviewGroup,
  ReviewHashState,
  ReviewItem,
  ReviewPayload,
} from "./types.ts"
import { useNarrowLayout } from "./use-narrow-layout.ts"

const LEFT_DEFAULT = 240
const RIGHT_DEFAULT = 220
const LEFT_MIN = 160
const RIGHT_MIN = 200
const LEFT_MAX = 560
const RIGHT_MAX = 760
const CENTER_MIN = 280
const COLUMN_GUTTER = 16

function clampWidth(value: number, min: number, max: number): number {
  return Math.round(Math.min(max, Math.max(min, value)))
}

function sideBounds(
  total: number,
  other: number,
  sideMin: number,
  sideMax: number
): { min: number; max: number } {
  if (total <= 400) {
    return { min: sideMin, max: sideMax }
  }
  const room = Math.max(0, total - other - CENTER_MIN - COLUMN_GUTTER)
  const max = Math.min(sideMax, room)
  const min = Math.min(sideMin, max)
  return { min, max: Math.max(min, max) }
}

function ReviewToolbar({
  narrow,
  items,
  filter,
  onChange,
}: {
  narrow: boolean
  items: ReviewItem[]
  filter: ReviewFilter
  onChange: (next: ReviewFilter) => void
}) {
  return (
    <header
      data-review-toolbar="edges"
      className="z-30 flex h-12 shrink-0 items-center gap-3 border-b border-[#334155] bg-[#1a2332] px-3"
    >
      <NavBar />
      <TopBar
        items={items}
        filter={filter}
        onChange={onChange}
        narrow={narrow}
      />
    </header>
  )
}

function PanelResizeHandle({
  side,
  onPointerDown,
}: {
  side: "left" | "right"
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void
}) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={side === "left" ? "调整项目栏宽度" : "调整正文栏宽度"}
      data-panel-resize={side}
      className="group relative z-10 hidden cursor-col-resize touch-none md:block"
      onPointerDown={onPointerDown}
    >
      <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[#334155] group-hover:bg-[#5b9fd4]" />
    </div>
  )
}

function readPayloadScript(): ReviewPayload {
  const text =
    document.getElementById("edges-review-payload")?.textContent?.trim() || "{}"
  const parsed = JSON.parse(text) as Partial<ReviewPayload>
  return {
    groups: parsed.groups ?? [],
    items: parsed.items ?? [],
  }
}

function filterFromHash(state: ReviewHashState): ReviewFilter {
  return {
    q: state.q,
    priority: state.priority,
    assignee: state.assignee,
    status: state.status,
    projectId: state.projectId,
  }
}

export default function App({
  initialPayload,
}: {
  initialPayload?: ReviewPayload
}) {
  const [groups] = useState<ReviewGroup[]>(
    () => (initialPayload ?? readPayloadScript()).groups
  )
  const [items, setItems] = useState<ReviewItem[]>(
    () => (initialPayload ?? readPayloadScript()).items
  )
  const [hashState, setHashState] = useState<ReviewHashState>(() =>
    parseReviewHash(window.location.hash)
  )
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  useEffect(() => {
    const onPop = () => setHashState(parseReviewHash(window.location.hash))
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [])

  useEffect(() => {
    const next = buildReviewHash(hashState)
    if (window.location.hash !== next) {
      navigateReviewHash(next)
    }
  }, [hashState])

  const filter = filterFromHash(hashState)
  const selected = items.find(
    (item) => item.stem === hashState.stem && matchesReviewFilter(item, filter)
  )
  const narrow = useNarrowLayout()
  const [leftWidth, setLeftWidth] = useState(LEFT_DEFAULT)
  const [rightWidth, setRightWidth] = useState(RIGHT_DEFAULT)
  const [detailOpen, setDetailOpen] = useState(() => hashState.stem !== "")
  const columnsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (hashState.stem !== "") setDetailOpen(true)
  }, [hashState.stem])

  function onResizePointerDown(
    side: "left" | "right",
    event: ReactPointerEvent<HTMLDivElement>
  ) {
    event.preventDefault()
    const startX = event.clientX
    const startLeft = leftWidth
    const startRight = rightWidth
    const total = columnsRef.current?.getBoundingClientRect().width ?? 0
    const move = (pointer: PointerEvent) => {
      const dx = pointer.clientX - startX
      if (side === "left") {
        const bounds = sideBounds(total, startRight, LEFT_MIN, LEFT_MAX)
        setLeftWidth(clampWidth(startLeft + dx, bounds.min, bounds.max))
      } else {
        const bounds = sideBounds(total, startLeft, RIGHT_MIN, RIGHT_MAX)
        setRightWidth(clampWidth(startRight - dx, bounds.min, bounds.max))
      }
    }
    const up = () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
  }

  const toolbar = (
    <ReviewToolbar
      narrow={narrow}
      items={items}
      filter={filter}
      onChange={(next) => setHashState((prev) => ({ ...prev, ...next }))}
    />
  )

  return (
    <div
      data-review-shell="edges"
      className="relative flex h-screen max-w-full flex-col overflow-x-hidden overflow-y-hidden"
    >
      {toolbar}
      <DndContext
        sensors={sensors}
        onDragEnd={(event) => {
          const projectId = projectIdFromDrop(
            event.over ? String(event.over.id) : undefined
          )
          if (!projectId) return
          setItems((prev) =>
            applyProjectDrop(prev, String(event.active.id), projectId)
          )
        }}
      >
        <div
          ref={columnsRef}
          data-review-columns="edges"
          className="flex min-h-0 w-full max-w-full min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto md:grid md:overflow-hidden"
          style={{
            gridTemplateColumns: `${leftWidth}px 8px minmax(${CENTER_MIN}px,1fr) 8px ${rightWidth}px`,
          }}
        >
          <ProjectColumn
            groups={groups}
            items={items}
            filter={filter}
            narrow={narrow}
            onSelect={(projectId) =>
              setHashState((prev) => ({ ...prev, projectId }))
            }
          />
          <PanelResizeHandle
            side="left"
            onPointerDown={(event) => onResizePointerDown("left", event)}
          />
          <StatusBoard
            items={items}
            groups={groups}
            filter={filter}
            narrow={narrow}
            selectedStem={hashState.stem}
            onSelect={(stem) => {
              setDetailOpen(true)
              setHashState((prev) => ({ ...prev, stem }))
            }}
            onMove={(stem, projectId) =>
              setItems((prev) => applyProjectDrop(prev, stem, projectId))
            }
          />
          <PanelResizeHandle
            side="right"
            onPointerDown={(event) => onResizePointerDown("right", event)}
          />
          {narrow ? null : (
            <MarkdownPane item={selected} narrow={false} />
          )}
        </div>
        {narrow ? (
          <MarkdownPane
            item={selected}
            narrow
            open={detailOpen}
            onBack={() => setDetailOpen(false)}
          />
        ) : null}
      </DndContext>
    </div>
  )
}
