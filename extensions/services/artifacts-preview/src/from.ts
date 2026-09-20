export type ArtifactFrom = {
  type: "task";
  id: string;
  project: string;
};

const PROJECT_MAX = 64;
const ID_MAX = 200;

export function parseArtifactFrom(raw: unknown): ArtifactFrom | undefined {
  if (raw === undefined) {
    return undefined;
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("from must be an object with type, id, and project");
  }
  const rec = raw as { type?: unknown; project?: unknown; id?: unknown };
  const type = parseToken(rec.type, "from.type", 64);
  if (type !== "task") {
    throw new Error("from.type must be task");
  }
  return {
    type: "task",
    id: parseTaskPointer(rec.id, "from.id", ID_MAX),
    project: parseTaskPointer(rec.project, "from.project", PROJECT_MAX),
  };
}

function parseToken(value: unknown, field: string, max: number): string {
  if (typeof value !== "string") {
    throw new Error(`${field} must be a non-empty string`);
  }
  const trimmed = value.trim();
  if (!trimmed || /[\r\n\0]/.test(trimmed) || trimmed.length > max) {
    throw new Error(`${field} must be a non-empty string`);
  }
  return trimmed;
}

function parseTaskPointer(value: unknown, field: string, max: number): string {
  const trimmed = parseToken(value, field, max);
  if (trimmed.includes("/") || trimmed.includes("\\") || trimmed.includes("..")) {
    throw new Error(`${field} must not contain path separators or ..`);
  }
  return trimmed;
}
