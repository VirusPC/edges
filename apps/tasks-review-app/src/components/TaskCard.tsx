import { useDraggable } from "@dnd-kit/core";
import type { ReviewGroup, ReviewItem } from "../types.ts";

export function TaskCard({
  item,
  groups,
  onSelect,
}: {
  item: ReviewItem;
  groups: ReviewGroup[];
  onSelect: (stem: string) => void;
}) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: item.stem });
  const title = item.title || item.doc?.metadata["edges-title"] || item.doc?.name || item.stem;
  const projectTitle = groups.find((group) => group.id === item.suggested)?.title ?? item.suggested;
  return (
    <button
      type="button"
      ref={setNodeRef}
      data-stem={item.stem}
      onClick={() => onSelect(item.stem)}
      {...listeners}
      {...attributes}
    >
      <div>{item.stem}</div>
      <div>{title}</div>
      <div data-project-tag="true">{projectTitle}</div>
      <time data-updated="true">{item.doc?.metadata["edges-updated-at"] ?? ""}</time>
    </button>
  );
}
