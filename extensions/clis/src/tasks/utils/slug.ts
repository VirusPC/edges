import { localDateYmd } from "../../utils/date.js";

const HOSTILE = /[/\\:*?"<>|]/g;

export function taskFileSlug(title: string): string {
  const slug = title
    .replace(HOSTILE, "")
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return slug.length > 0 ? slug : "task";
}

export function taskNameSlug(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  return slug.length > 0 ? slug : "task";
}

export function newTaskStem(title: string, now: Date): string {
  return `${localDateYmd(now)}--${taskFileSlug(title)}`;
}
