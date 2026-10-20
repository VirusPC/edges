const HOSTILE = /[/\\:*?"<>|]/g;

export type DirectoryStemOptions = {
  separator?: "-" | "_";
  lowercase?: boolean;
  fallback?: string;
  /** Cap after cleanup. `chars` counts UTF-16 code units; `bytes` counts UTF-8. */
  maxLength?: number;
  maxLengthUnit?: "chars" | "bytes";
};

function capStem(slug: string, maxLength: number, unit: "chars" | "bytes"): string {
  if (unit === "chars") return slug.slice(0, Math.max(0, maxLength));
  if (Buffer.byteLength(slug) <= maxLength) return slug;
  const bytes = Buffer.from(slug);
  let end = Math.max(0, maxLength);
  while (end > 0 && (bytes[end] & 0xc0) === 0x80) end -= 1;
  return bytes.subarray(0, end).toString("utf8");
}

function trimSeparator(slug: string, separator: "-" | "_"): string {
  return separator === "_" ? slug.replace(/^_|_$/g, "") : slug.replace(/^-|-$/g, "");
}

/** Shared node stem. Keeps Unicode letters, marks, and digits; the caller picks separator and case. */
export function directoryStem(title: string, options: DirectoryStemOptions = {}): string {
  const separator = options.separator ?? "-";
  const fallback = options.fallback ?? "untitled";
  const normalized = title.normalize("NFC");
  const source = options.lowercase ? normalized.toLowerCase() : normalized;
  const withoutHostile = source.replace(HOSTILE, "");
  // "_" folds hyphens, matching task names. "-" drops underscores, matching file stems.
  const slug =
    separator === "_"
      ? withoutHostile
          .replace(/[\s-]+/g, "_")
          .replace(/[^\p{L}\p{N}\p{M}_]+/gu, "")
          .replace(/_+/g, "_")
          .replace(/^_|_$/g, "")
      : withoutHostile
          .replace(/\s+/g, "-")
          .replace(/[^\p{L}\p{N}\p{M}-]+/gu, "")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "");
  const capped =
    options.maxLength === undefined
      ? slug
      : capStem(slug, options.maxLength, options.maxLengthUnit ?? "chars");
  const trimmed = trimSeparator(capped, separator);
  return trimmed.length > 0 ? trimmed : fallback;
}
