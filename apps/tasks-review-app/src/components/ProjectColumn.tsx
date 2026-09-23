import { matchesReviewFilter, type ReviewFilter, type ReviewItem } from "../filter.ts";
import type { ReviewGroup } from "../types.ts";

export function ProjectColumn({
  groups,
  items,
  filter,
  onSelect,
}: {
  groups: ReviewGroup[];
  items: ReviewItem[];
  filter: ReviewFilter;
  onSelect: (projectId: string) => void;
}) {
  const topBar = { ...filter, projectId: "all" };
  return (
    <nav className="min-h-0 overflow-auto border-r border-[#334155] p-2">
      <ProjectRow
        id="all"
        title="全部"
        droppable="0"
        selected={filter.projectId === "all"}
        count={items.filter((item) => matchesReviewFilter(item, topBar)).length}
        onSelect={onSelect}
      />
      {groups.map((group) => (
        <ProjectRow
          key={group.id}
          id={group.id}
          title={group.title}
          droppable="1"
          selected={filter.projectId === group.id}
          count={items.filter((item) => matchesReviewFilter(item, { ...filter, projectId: group.id })).length}
          onSelect={onSelect}
        />
      ))}
    </nav>
  );
}

function ProjectRow({
  id,
  title,
  droppable,
  selected,
  count,
  onSelect,
}: {
  id: string;
  title: string;
  droppable: "0" | "1";
  selected: boolean;
  count: number;
  onSelect: (projectId: string) => void;
}) {
  return (
    <button
      type="button"
      data-project-id={id}
      data-droppable={droppable}
      data-filter={selected ? "on" : undefined}
      className={
        selected
          ? "border-solid border-[#5b9fd4] bg-[#1a2332] opacity-100"
          : "opacity-60 hover:opacity-100"
      }
      onClick={() => onSelect(id)}
    >
      <span>{title}</span>
      <span>{count}</span>
    </button>
  );
}
