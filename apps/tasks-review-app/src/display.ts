import type { ReviewItem } from "./types.ts";

export function reviewItemTitle(item: ReviewItem): string {
  return item.title || item.doc?.metadata["edges-title"] || item.doc?.name || item.stem;
}

const DAY_MS = 86_400_000;

export function shortUpdated(iso: string, now = Date.now()): string {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) {
    return "";
  }
  const delta = now - time;
  if (delta >= 0 && delta < DAY_MS) {
    const hours = Math.floor(delta / 3_600_000);
    if (hours <= 0) {
      return "刚刚";
    }
    return `${hours}小时前`;
  }
  const days = Math.floor(delta / DAY_MS);
  if (days === 1) {
    return "昨天";
  }
  if (days > 1 && days < 30) {
    return `${days}天前`;
  }
  const date = new Date(time);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function priorityBadgeClass(priority: string): string {
  switch (priority) {
    case "urgent":
      return "bg-[#3a2430] text-[#f0a8b4]";
    case "high":
      return "bg-[#3a3020] text-[#e7c27a]";
    case "medium":
      return "bg-[#1e3344] text-[#8ec5e8]";
    case "low":
      return "bg-[#243044] text-[#9aa8bc]";
    default:
      return "";
  }
}

export function statusDotClass(status: string): string {
  switch (status) {
    case "todo":
      return "bg-[#5b9fd4]";
    case "in_progress":
      return "bg-[#e2b657]";
    case "in_review":
      return "bg-[#b794f4]";
    case "done":
      return "bg-[#6fbf8b]";
    case "blocked":
      return "bg-[#e07a7a]";
    case "cancelled":
      return "bg-[#6b7280]";
    default:
      return "bg-[#9aa8bc]";
  }
}
