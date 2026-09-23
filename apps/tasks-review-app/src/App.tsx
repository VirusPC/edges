import { useEffect, useState } from "react";
import { MarkdownPane } from "./components/MarkdownPane.tsx";
import { ProjectColumn } from "./components/ProjectColumn.tsx";
import { StatusBoard } from "./components/StatusBoard.tsx";
import { TopBar } from "./components/TopBar.tsx";
import { matchesReviewFilter, type ReviewFilter } from "./filter.ts";
import { buildReviewHash, navigateReviewHash, parseReviewHash } from "./hash.ts";
import type { ReviewHashState, ReviewPayload } from "./types.ts";

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
  const [payload] = useState<ReviewPayload>(() => initialPayload ?? readPayloadScript());
  const [hashState, setHashState] = useState<ReviewHashState>(() => parseReviewHash(window.location.hash));

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
  const selected = payload.items.find((item) => item.stem === hashState.stem && matchesReviewFilter(item, filter));

  return (
    <div data-review-shell="edges" className="flex h-screen flex-col">
      <TopBar
        items={payload.items}
        filter={filter}
        onChange={(next) => setHashState((prev) => ({ ...prev, ...next }))}
      />
      <div className="grid min-h-0 flex-1 grid-cols-[240px_minmax(0,1fr)_320px]">
        <ProjectColumn
          groups={payload.groups}
          items={payload.items}
          filter={filter}
          onSelect={(projectId) => setHashState((prev) => ({ ...prev, projectId }))}
        />
        <StatusBoard
          items={payload.items}
          groups={payload.groups}
          filter={filter}
          onSelect={(stem) => setHashState((prev) => ({ ...prev, stem }))}
        />
        <MarkdownPane body={selected?.doc?.body ?? ""} />
      </div>
    </div>
  );
}
