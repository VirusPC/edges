import {
  DEFAULT_TASK_PROJECT,
  TasksError,
  type TaskProjectId,
  type TaskProjectRecord,
} from "./types.js";

export type { TaskProjectRecord };

export const DEFAULT_PROJECT_TITLE = "Default";
export const DEFAULT_PROJECT_DESCRIPTION =
  "Ungrouped tasks that have not been assigned a named Task Project.";

const TITLE_MESSAGE = "invalid Task Project title (expected 1–120 characters, no newlines)";
const DESCRIPTION_MESSAGE = "invalid Task Project description (expected 1–2000 characters)";

export function seedTitleFor(id: TaskProjectId): string {
  return id === DEFAULT_TASK_PROJECT ? DEFAULT_PROJECT_TITLE : id;
}

export function seedDescriptionFor(id: TaskProjectId): string {
  return id === DEFAULT_TASK_PROJECT
    ? DEFAULT_PROJECT_DESCRIPTION
    : `Task Project ${id}.`;
}

export function parseProjectTitle(raw: string): string {
  const title = raw.trim();
  if (title.length < 1 || title.length > 120 || /[\r\n]/.test(title)) {
    throw new TasksError("VALIDATION_ERROR", TITLE_MESSAGE);
  }
  return title;
}

export function parseProjectDescription(raw: string): string {
  const description = raw.trim();
  if (description.length < 1 || description.length > 2000) {
    throw new TasksError("VALIDATION_ERROR", DESCRIPTION_MESSAGE);
  }
  return description;
}

export function parseProjectAgents(markdown: string): {
  title: string;
  description: string;
  pointers?: string;
} {
  if (markdown.startsWith("---")) {
    throw new TasksError(
      "VALIDATION_ERROR",
      "Task Project AGENTS.md must not have YAML frontmatter",
    );
  }
  if (markdown.includes("<!-- project-memory:")) {
    throw new TasksError(
      "VALIDATION_ERROR",
      "Task Project AGENTS.md must not contain project-memory markers",
    );
  }

  const lines = markdown.split("\n");
  const heading = lines[0] ?? "";
  const match = heading.match(/^# (.+)$/);
  if (!match) {
    throw new TasksError("VALIDATION_ERROR", TITLE_MESSAGE);
  }
  const title = parseProjectTitle(match[1]);

  const rest = lines.slice(1);
  const pointerIdx = rest.findIndex((line) => line === "## Pointers");
  const descriptionSource =
    pointerIdx === -1 ? rest.join("\n") : rest.slice(0, pointerIdx).join("\n");
  const description = parseProjectDescription(descriptionSource);

  if (pointerIdx === -1) {
    return { title, description };
  }
  return { title, description, pointers: rest.slice(pointerIdx).join("\n") };
}

export function renderProjectAgents(input: {
  title: string;
  description: string;
  pointers?: string;
}): string {
  let out = `# ${input.title}\n\n${input.description}\n`;
  if (input.pointers !== undefined && input.pointers.length > 0) {
    const block = input.pointers.startsWith("## Pointers")
      ? input.pointers.trimEnd()
      : `## Pointers\n\n${input.pointers.trim()}`;
    out += `\n${block}\n`;
  }
  return out;
}
