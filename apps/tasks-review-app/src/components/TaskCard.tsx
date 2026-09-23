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
  const title = item.title || item.doc?.metadata["edges-title"] || item.doc?.name || item.stem;
  const projectTitle = groups.find((group) => group.id === item.suggested)?.title ?? item.suggested;
  return (
    <button type="button" data-stem={item.stem} onClick={() => onSelect(item.stem)}>
      <div>{item.stem}</div>
      <div>{title}</div>
      <div data-project-tag="true">{projectTitle}</div>
      <time data-updated="true">{item.doc?.metadata["edges-updated-at"] ?? ""}</time>
    </button>
  );
}
