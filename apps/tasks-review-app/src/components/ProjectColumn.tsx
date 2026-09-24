import { useDroppable } from "@dnd-kit/core";
import { useState } from "react";
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
    <nav data-review-projects="edges" className="w-full min-w-0 shrink-0 overflow-auto bg-[#0f1419] p-2 md:min-h-0">
      <p className="px-2.5 pb-1 pt-1 text-[11px] font-medium tracking-wide text-[#9aa8bc]">项目</p>
      <ProjectRow
        id="all"
        title="全部"
        description=""
        droppable="0"
        selected={filter.projectId === "all"}
        count={items.filter((item) => matchesReviewFilter(item, topBar)).length}
        onSelect={onSelect}
      />
      {groups.map((group) => (
        <ProjectDropRow
          key={group.id}
          id={group.id}
          title={group.title}
          description={group.description ?? ""}
          selected={filter.projectId === group.id}
          count={items.filter((item) => matchesReviewFilter(item, { ...filter, projectId: group.id })).length}
          onSelect={onSelect}
        />
      ))}
    </nav>
  );
}

function projectRowClass(selected: boolean, over = false): string {
  const layout =
    "group mb-1 flex w-full items-start justify-between gap-3 rounded-lg border px-2.5 py-2 text-left text-sm text-[#e7ecf3]";
  const state = selected
    ? "border-solid border-[#5b9fd4] bg-[#1a2332] opacity-100"
    : "border-transparent opacity-60 hover:opacity-100";
  const overClass = over ? " outline outline-2 outline-offset-[3px] outline-[#5b9fd4]" : "";
  return `${layout} ${state}${overClass}`;
}

function CountBadge({ count }: { count: number }) {
  return (
    <span className="shrink-0 rounded-full bg-[#0f1419] px-2 py-0.5 text-xs tabular-nums text-[#9aa8bc]">
      {count}
    </span>
  );
}

function ProjectDropRow({
  id,
  title,
  description,
  selected,
  count,
  onSelect,
}: {
  id: string;
  title: string;
  description: string;
  selected: boolean;
  count: number;
  onSelect: (projectId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `project:${id}` });
  const [open, setOpen] = useState(false);
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
  );
}

function ProjectLabel({ title, description, open }: { title: string; description: string; open: boolean }) {
  const text = description.trim();
  return (
    <span className="min-w-0 flex-1">
      <span className="block truncate">{title}</span>
      {text !== "" ? (
        <span className={`${open ? "mt-1 block" : "hidden"} text-xs leading-snug font-normal whitespace-normal text-[#9aa8bc]`}>
          {text}
        </span>
      ) : null}
    </span>
  );
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
  id: string;
  title: string;
  description: string;
  droppable: "0" | "1";
  selected: boolean;
  count: number;
  onSelect: (projectId: string) => void;
}) {
  const [open, setOpen] = useState(false);
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
  );
}
