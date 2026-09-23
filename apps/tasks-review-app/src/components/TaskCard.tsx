import { useDraggable } from "@dnd-kit/core";
import { itemPriority } from "../filter.ts";
import { priorityBadgeClass, reviewItemTitle, shortUpdated } from "../display.ts";
import type { ReviewGroup, ReviewItem } from "../types.ts";

export function TaskCard({
  item,
  groups,
  selected,
  onSelect,
}: {
  item: ReviewItem;
  groups: ReviewGroup[];
  selected: boolean;
  onSelect: (stem: string) => void;
}) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: item.stem });
  const title = reviewItemTitle(item);
  const projectTitle = groups.find((group) => group.id === item.suggested)?.title ?? item.suggested;
  const priority = itemPriority(item);
  const updated = shortUpdated(item.doc?.metadata["edges-updated-at"] ?? "");
  const selectedClass = selected
    ? " border-solid border-[#5b9fd4] ring-1 ring-[#5b9fd4]/50"
    : " border-[#334155] hover:border-[#5b9fd4]/70";
  return (
    <button
      type="button"
      ref={setNodeRef}
      data-stem={item.stem}
      data-selected={selected ? "on" : undefined}
      onClick={() => onSelect(item.stem)}
      {...listeners}
      {...attributes}
      className={
        "flex w-full cursor-grab flex-col gap-2 rounded-lg border bg-[#1a2332] p-3 text-left shadow-sm active:cursor-grabbing" +
        selectedClass
      }
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium leading-snug text-[#e7ecf3]">{title}</span>
        {priority !== "none" ? (
          <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] leading-none ${priorityBadgeClass(priority)}`}>
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
      <span className="truncate font-mono text-[10px] leading-none text-[#9aa8bc]/80">{item.stem}</span>
    </button>
  );
}
