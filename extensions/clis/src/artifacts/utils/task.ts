export type ArtifactTask = {
  project: string;
  stem: string;
};

const PROJECT_MAX = 64;
const STEM_MAX = 200;

export function parseArtifactTask(raw: unknown): ArtifactTask | undefined {
  if (raw === undefined) {
    return undefined;
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("task must be an object with project and stem");
  }
  const rec = raw as { project?: unknown; stem?: unknown };
  return {
    project: parseTaskField(rec.project, "task.project", PROJECT_MAX),
    stem: parseTaskField(rec.stem, "task.stem", STEM_MAX),
  };
}

export function parseArtifactTaskFlags(
  project: string | undefined,
  stem: string | undefined,
): ArtifactTask | undefined {
  if (project === undefined && stem === undefined) {
    return undefined;
  }
  if (project === undefined || stem === undefined) {
    throw new Error("--task-project and --task-stem must be set together");
  }
  return parseArtifactTask({ project, stem });
}

function parseTaskField(value: unknown, field: string, max: number): string {
  if (typeof value !== "string") {
    throw new Error(`${field} must be a non-empty string`);
  }
  const trimmed = value.trim();
  if (!trimmed || /[\r\n\0]/.test(trimmed) || trimmed.length > max) {
    throw new Error(`${field} must be a non-empty string`);
  }
  if (trimmed.includes("/") || trimmed.includes("\\") || trimmed.includes("..")) {
    throw new Error(`${field} must not contain path separators or ..`);
  }
  return trimmed;
}
