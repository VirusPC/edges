import {
  parseDocument,
  serializeDocument,
} from "../../utils/markdown/document.js";
export const FLAT_COMPAT_KEYS = [
  "title",
  "type",
  "originSessionId",
  "agentClient",
  "username",
  "email",
  "updatedAt",
];
export const METADATA_KEY_MAP: Record<string, string> = {
  "edges-title": "title",
  "edges-type": "type",
  "edges-origin-session-id": "originSessionId",
  "edges-agent-client": "agentClient",
  "edges-username": "username",
  "edges-email": "email",
  "edges-updated-at": "updatedAt",
  ...Object.fromEntries(FLAT_COMPAT_KEYS.map((k) => [k, k])),
};
export function closedFrontmatter(source: string): boolean {
  return /^\uFEFF?---\s*\r?\n[\s\S]*?\r?\n---\s*(?:\r?\n|$)/.test(source);
}
/** Mutation callers must not interpret unreadable metadata as an empty mapping. */
export function strictFrontmatterData(source: string): Record<string, unknown> {
  if (!closedFrontmatter(source)) {
    throw new Error("Invalid entry: missing closed YAML frontmatter");
  }
  return parseDocument(source).metadata ?? {};
}
/** Discovery is tolerant so doctor can report invalid entries without rewriting them. */
export function frontmatterData(source: string): Record<string, unknown> {
  try {
    return strictFrontmatterData(source);
  } catch {
    return {};
  }
}
export function logicalFields(
  data: Record<string, unknown>,
): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const [key, value] of Object.entries(data))
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    )
      fields[key] = String(value);
  const metadata = data.metadata;
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata))
    for (const [key, value] of Object.entries(metadata)) {
      const internal = METADATA_KEY_MAP[key];
      if (internal && value !== null && value !== undefined)
        fields[internal] =
          value instanceof Date ? value.toISOString() : String(value);
    }
  return fields;
}
/** Keep vendor metadata and spec fields while migrating known implementation keys. */
export function preserveEntryMetadata(
  rendered: string,
  previousSource?: string,
): string {
  if (previousSource === undefined) return rendered;
  const previous = strictFrontmatterData(previousSource),
    next = parseDocument(rendered);
  for (const key of FLAT_COMPAT_KEYS) delete previous[key];
  const metadata = (value: unknown): Record<string, unknown> =>
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  return serializeDocument({
    body: next.body,
    metadata: {
      ...previous,
      ...next.metadata,
      metadata: {
        ...metadata(previous.metadata),
        ...metadata(next.metadata?.metadata),
      },
    },
  });
}
