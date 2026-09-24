import { DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { MarkdownPane } from "./components/MarkdownPane.tsx";
import { ProjectColumn } from "./components/ProjectColumn.tsx";
import { StatusBoard } from "./components/StatusBoard.tsx";
import { TopBar } from "./components/TopBar.tsx";
import { applyProjectDrop, projectIdFromDrop } from "./export.ts";
import { matchesReviewFilter, type ReviewFilter } from "./filter.ts";
import { buildReviewHash, navigateReviewHash, parseReviewHash } from "./hash.ts";
import type { ReviewGroup, ReviewHashState, ReviewItem, ReviewPayload } from "./types.ts";

function clampWidth(value: number, min: number, max: number): number {
  return Math.round(Math.min(max, Math.max(min, value)));
}

function PanelResizeHandle({
  side,
  onPointerDown,
}: {
  side: "left" | "right";
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={side === "left" ? "调整项目栏宽度" : "调整正文栏宽度"}
      data-panel-resize={side}
      className="group relative z-10 cursor-col-resize touch-none"
      onPointerDown={onPointerDown}
    >
      <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[#334155] group-hover:bg-[#5b9fd4]" />
    </div>
  );
}

function readPayloadScript(): ReviewPayload {
  const text = document.getElementById("edges-review-payload")?.textContent?.trim() || "{}";
  const parsed = JSON.parse(text) as Partial<ReviewPayload>;
  return {
    groups: parsed.groups ?? [],
    items: parsed.items ?? [],
  };
}

function filterFromHash(state: ReviewHashState): ReviewFilter {
  return {
    q: state.q,
    priority: state.priority,
    assignee: state.assignee,
    status: state.status,
    projectId: state.projectId,
  };
}

export default function App({ initialPayload }: { initialPayload?: ReviewPayload }) {
  const [groups] = useState<ReviewGroup[]>(() => (initialPayload ?? readPayloadScript()).groups);
  const [items, setItems] = useState<ReviewItem[]>(() => (initialPayload ?? readPayloadScript()).items);
  const [hashState, setHashState] = useState<ReviewHashState>(() => parseReviewHash(window.location.hash));
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    const onPop = () => setHashState(parseReviewHash(window.location.hash));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    const next = buildReviewHash(hashState);
    if (window.location.hash !== next) {
      navigateReviewHash(next);
    }
  }, [hashState]);

  const filter = filterFromHash(hashState);
  const selected = items.find((item) => item.stem === hashState.stem && matchesReviewFilter(item, filter));
  const [leftWidth, setLeftWidth] = useState(240);
  const [rightWidth, setRightWidth] = useState(380);
  const columnsRef = useRef<HTMLDivElement>(null);

  function onResizePointerDown(side: "left" | "right", event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault();
    const startX = event.clientX;
    const startLeft = leftWidth;
    const startRight = rightWidth;
    const total = columnsRef.current?.getBoundingClientRect().width ?? 0;
    const move = (pointer: PointerEvent) => {
      const dx = pointer.clientX - startX;
      const centerMin = 280;
      const gutters = 16;
      if (side === "left") {
        const max = total > 400 ? Math.max(160, total - startRight - centerMin - gutters) : 560;
        setLeftWidth(clampWidth(startLeft + dx, 160, Math.min(560, max)));
      } else {
        const max = total > 400 ? Math.max(260, total - startLeft - centerMin - gutters) : 760;
        setRightWidth(clampWidth(startRight - dx, 260, Math.min(760, max)));
      }
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  return (
    <div data-review-shell="edges" className="flex h-screen flex-col">
      <TopBar
        items={items}
        filter={filter}
        onChange={(next) => setHashState((prev) => ({ ...prev, ...next }))}
      />
      <DndContext
        sensors={sensors}
        onDragEnd={(event) => {
          const projectId = projectIdFromDrop(event.over ? String(event.over.id) : undefined);
          if (!projectId) return;
          setItems((prev) => applyProjectDrop(prev, String(event.active.id), projectId));
        }}
      >
        <div
          ref={columnsRef}
          data-review-columns="edges"
          className="grid min-h-0 flex-1"
          style={{ gridTemplateColumns: `${leftWidth}px 8px minmax(0,1fr) 8px ${rightWidth}px` }}
        >
          <ProjectColumn
            groups={groups}
            items={items}
            filter={filter}
            onSelect={(projectId) => setHashState((prev) => ({ ...prev, projectId }))}
          />
          <PanelResizeHandle side="left" onPointerDown={(event) => onResizePointerDown("left", event)} />
          <StatusBoard
            items={items}
            groups={groups}
            filter={filter}
            selectedStem={hashState.stem}
            onSelect={(stem) => setHashState((prev) => ({ ...prev, stem }))}
          />
          <PanelResizeHandle side="right" onPointerDown={(event) => onResizePointerDown("right", event)} />
          <MarkdownPane item={selected} />
        </div>
      </DndContext>
    </div>
  );
}
