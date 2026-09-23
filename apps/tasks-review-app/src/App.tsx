import { DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useEffect, useState } from "react";
import { MarkdownPane } from "./components/MarkdownPane.tsx";
import { ProjectColumn } from "./components/ProjectColumn.tsx";
import { StatusBoard } from "./components/StatusBoard.tsx";
import { TopBar } from "./components/TopBar.tsx";
import { applyProjectDrop, projectIdFromDrop } from "./export.ts";
import { matchesReviewFilter, type ReviewFilter } from "./filter.ts";
import { buildReviewHash, navigateReviewHash, parseReviewHash } from "./hash.ts";
import type { ReviewGroup, ReviewHashState, ReviewItem, ReviewPayload } from "./types.ts";

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
        <div className="grid min-h-0 flex-1 grid-cols-[240px_minmax(0,1fr)_320px]">
          <ProjectColumn
            groups={groups}
            items={items}
            filter={filter}
            onSelect={(projectId) => setHashState((prev) => ({ ...prev, projectId }))}
          />
          <StatusBoard
            items={items}
            groups={groups}
            filter={filter}
            onSelect={(stem) => setHashState((prev) => ({ ...prev, stem }))}
          />
          <MarkdownPane body={selected?.doc?.body ?? ""} />
        </div>
      </DndContext>
    </div>
  );
}
