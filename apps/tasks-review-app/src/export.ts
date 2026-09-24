import type { ReviewItem } from "./types.ts";

export function exportReviewRows(items: ReviewItem[]): Array<{
  stem: string;
  current: string;
  suggested: string;
  action: "keep" | "move";
  note: string;
}> {
  return items.map((item) => ({
    stem: item.stem,
    current: item.current,
    suggested: item.suggested,
    action: item.suggested === item.current ? "keep" : "move",
    note: item.note ?? "",
  }));
}

export function applyProjectDrop(items: ReviewItem[], stem: string, projectId: string): ReviewItem[] {
  return items.map((item) => (item.stem === stem ? { ...item, suggested: projectId } : item));
}

export function projectIdFromDrop(overId: string | undefined): string | undefined {
  if (!overId?.startsWith("project:")) return undefined;
  const id = overId.slice("project:".length);
  return id === "" ? undefined : id;
}
