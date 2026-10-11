const HOSTILE = /[/\\:*?"<>|]/g;

export type DirectoryStemOptions = {
  separator?: "-" | "_";
  lowercase?: boolean;
  fallback?: string;
  maxLength?: number;
};

/** Shared node stem. Keeps Unicode letters and digits; the caller picks separator and case. */
export function directoryStem(title: string, options: DirectoryStemOptions = {}): string {
  const separator = options.separator ?? "-";
  const fallback = options.fallback ?? "untitled";
  const source = options.lowercase ? title.toLowerCase() : title;
  const withoutHostile = source.replace(HOSTILE, "");
  // "_" folds hyphens, matching task names. "-" drops underscores, matching file stems.
  const slug =
    separator === "_"
      ? withoutHostile
          .replace(/[\s-]+/g, "_")
          .replace(/[^\p{L}\p{N}_]+/gu, "")
          .replace(/_+/g, "_")
          .replace(/^_|_$/g, "")
      : withoutHostile
          .replace(/\s+/g, "-")
          .replace(/[^\p{L}\p{N}-]+/gu, "")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "");
  const limited = options.maxLength === undefined ? slug : slug.slice(0, options.maxLength);
  return limited.length > 0 ? limited : fallback;
}
