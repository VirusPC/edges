export type ArtifactFromNamed = {
  type: string;
  name: string;
};

export type ArtifactFromTask = {
  type: "task";
  project: string;
  stem: string;
};

export type ArtifactFrom = ArtifactFromNamed | ArtifactFromTask;

const TYPE_MAX = 64;
const NAME_MAX = 120;
const PROJECT_MAX = 64;
const STEM_MAX = 200;

export function parseArtifactFrom(raw: unknown): ArtifactFrom {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("from must be an object with type");
  }
  const rec = raw as { type?: unknown; name?: unknown; project?: unknown; stem?: unknown };
  const type = parseToken(rec.type, "from.type", TYPE_MAX);
  if (type === "task") {
    return {
      type: "task",
      project: parseTaskPointer(rec.project, "from.project", PROJECT_MAX),
      stem: parseTaskPointer(rec.stem, "from.stem", STEM_MAX),
    };
  }
  return {
    type,
    name: parseToken(rec.name, "from.name", NAME_MAX),
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
