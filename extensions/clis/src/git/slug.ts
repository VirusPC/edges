export function localDateYmd(now: Date): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function titleToSlug(title: string, now: Date = new Date()): string {
  const slug = title.toLowerCase().replace(/ /g, "-").replace(/[^a-z0-9-]/g, "");
  if (slug.length === 0) {
    return `untitled-${Math.floor(now.getTime() / 1000)}`;
  }
  return slug;
}
