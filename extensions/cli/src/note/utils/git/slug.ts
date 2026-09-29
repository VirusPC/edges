export { localDateYmd } from "../../../utils/date.js";

export function titleToSlug(title: string, now: Date = new Date()): string {
  const slug = title.toLowerCase().replace(/ /g, "-").replace(/[^a-z0-9-]/g, "");
  if (slug.length === 0) {
    return `untitled-${Math.floor(now.getTime() / 1000)}`;
  }
  return slug;
}
