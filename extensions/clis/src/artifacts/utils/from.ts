export type ArtifactFromNamed = {
  kind: string;
  name: string;
};

export type ArtifactFromTask = {
  kind: "task";
  project: string;
  stem: string;
};

export type ArtifactFrom = ArtifactFromNamed | ArtifactFromTask;

const KIND_MAX = 64;
const NAME_MAX = 120;
const PROJECT_MAX = 64;
const STEM_MAX = 200;

export function parseArtifactFrom(raw: unknown): ArtifactFrom {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("from must be an object with kind");
  }
  const rec = raw as { kind?: unknown; name?: unknown; project?: unknown; stem?: unknown };
  const kind = parseToken(rec.kind, "from.kind", KIND_MAX);
  if (kind === "task") {
    return {
      kind: "task",
      project: parseTaskPointer(rec.project, "from.project", PROJECT_MAX),
      stem: parseTaskPointer(rec.stem, "from.stem", STEM_MAX),
    };
  }
  return {
    kind,
    name: parseToken(rec.name, "from.name", NAME_MAX),
  };
}

export function parseArtifactFromFlags(opts: {
  kind: string;
  name: string;
  taskProject?: string;
  taskStem?: string;
}): ArtifactFrom {
  const kind = parseToken(opts.kind, "from.kind", KIND_MAX);
  if (kind === "task") {
    if (opts.taskProject === undefined || opts.taskStem === undefined) {
      throw new Error("--from-kind task requires --task-project and --task-stem");
    }
    return parseArtifactFrom({ kind: "task", project: opts.taskProject, stem: opts.taskStem });
  }
  if (opts.taskProject !== undefined || opts.taskStem !== undefined) {
    throw new Error("--task-project and --task-stem are only valid with --from-kind task");
  }
  return parseArtifactFrom({ kind, name: opts.name });
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
