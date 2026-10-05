import { itemIdentity, type ReviewItem, type ReviewGroup } from "./types.ts";

export function sameSource(item: ReviewItem, group: ReviewGroup): boolean {
  return item.source?.scope === group.source?.scope && item.source?.purpose === group.source?.purpose;
}

export function exportReviewRows(items: ReviewItem[], groups: ReviewGroup[] = []) {
  return items.map(item => ({
    stem: item.stem,
    current: item.source ? (groups.find(group => group.id === item.current)?.project ?? item.project!) : item.current,
    suggested: item.source ? (groups.find(group => group.id === item.suggested)?.project ?? item.project!) : item.suggested,
    ...(item.source ? { source: item.source } : {}),
    action: item.suggested === item.current ? "keep" as const : "move" as const,
    note: item.note ?? "",
  }));
}

export function applyProjectDrop(items: ReviewItem[], identity: string, projectId: string, groups: ReviewGroup[] = []): ReviewItem[] {
  return items.map(item => {
    if (itemIdentity(item) !== identity) return item;
    if (item.source) {
      const group = groups.find(group => group.id === projectId);
      if (!group || !sameSource(item, group)) return item;
    }
    return { ...item, suggested: projectId };
  });
}

export function projectIdFromDrop(overId: string | undefined): string | undefined {
  if (!overId?.startsWith("project:")) return undefined;
  const id = overId.slice("project:".length);
  return id === "" ? undefined : id;
}
