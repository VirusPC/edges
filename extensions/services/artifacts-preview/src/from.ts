export type ArtifactFrom = {
  kind: string;
  name: string;
};

const KIND_MAX = 64;
const NAME_MAX = 120;

export function parseArtifactFrom(raw: unknown): ArtifactFrom {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("from must be an object with kind and name");
  }
  const rec = raw as { kind?: unknown; name?: unknown };
  return {
    kind: parseFromField(rec.kind, "from.kind", KIND_MAX),
    name: parseFromField(rec.name, "from.name", NAME_MAX),
  };
}

function parseFromField(value: unknown, field: string, max: number): string {
  if (typeof value !== "string") {
    throw new Error(`${field} must be a non-empty string`);
  }
  const trimmed = value.trim();
  if (!trimmed || /[\r\n]/.test(trimmed) || trimmed.length > max) {
    throw new Error(`${field} must be a non-empty string`);
  }
  return trimmed;
}
