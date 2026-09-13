import type { TaskStatus } from "./types.js";

export type ParsedTaskDoc = {
  name: string;
  description: string;
  metadata: Record<string, string>;
  body: string;
  rawFrontmatter: string;
};

function stripQuotes(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function quoteYamlValue(value: string): string {
  if (value.startsWith("{") || /[:#]/.test(value)) {
    return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  return value;
}

function splitFrontmatter(markdown: string): { rawFrontmatter: string; body: string; lines: string[] } {
  const normalized = markdown.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n") && normalized !== "---") {
    return { rawFrontmatter: "", body: markdown, lines: [] };
  }
  const afterOpen = normalized.startsWith("---\n") ? normalized.slice(4) : "";
  const close = afterOpen.indexOf("\n---");
  if (close < 0) {
    return { rawFrontmatter: "", body: markdown, lines: [] };
  }
  const rawFrontmatter = afterOpen.slice(0, close);
  let rest = afterOpen.slice(close + "\n---".length);
  if (rest.startsWith("\n")) {
    rest = rest.slice(1);
  }
  return { rawFrontmatter, body: rest, lines: rawFrontmatter.split("\n") };
}

export function parseTaskDoc(markdown: string): ParsedTaskDoc {
  const { rawFrontmatter, body, lines } = splitFrontmatter(markdown);
  let name = "";
  let description = "";
  const metadata: Record<string, string> = {};
  let inMetadata = false;

  for (const line of lines) {
    if (line === "metadata:" || line.startsWith("metadata:")) {
      inMetadata = true;
      continue;
    }
    if (inMetadata) {
      const meta = line.match(/^  ([A-Za-z0-9_-]+):\s*(.*)$/);
      if (meta) {
        metadata[meta[1] ?? ""] = stripQuotes(meta[2] ?? "");
        continue;
      }
      if (line.startsWith("  ") || line.trim() === "") {
        continue;
      }
      inMetadata = false;
    }
    const top = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!top) {
      continue;
    }
    const key = top[1];
    const value = stripQuotes(top[2] ?? "");
    if (key === "name") {
      name = value;
    } else if (key === "description") {
      description = value;
    }
  }

  return { name, description, metadata, body, rawFrontmatter };
}

function joinDoc(frontmatterLines: string[], body: string): string {
  const front = frontmatterLines.join("\n");
  const trimmedBody = body.endsWith("\n") || body.length === 0 ? body : `${body}\n`;
  return `---\n${front}\n---\n\n${trimmedBody.startsWith("\n") ? trimmedBody.slice(1) : trimmedBody}`;
}

export function setMetadataField(markdown: string, key: string, value: string): string {
  const { rawFrontmatter, body, lines } = splitFrontmatter(markdown);
  if (lines.length === 0 && rawFrontmatter === "") {
    return markdown;
  }
  const nextLines = [...lines];
  const pattern = new RegExp(`^  ${key}:`);
  const index = nextLines.findIndex((line) => pattern.test(line));
  const rendered = `  ${key}: ${quoteYamlValue(value)}`;
  if (index >= 0) {
    nextLines[index] = rendered;
    return joinDoc(nextLines, body);
  }
  let insertAt = nextLines.length;
  for (let i = nextLines.length - 1; i >= 0; i--) {
    if (/^  [A-Za-z0-9_-]+:/.test(nextLines[i] ?? "")) {
      insertAt = i + 1;
      break;
    }
    if ((nextLines[i] ?? "").startsWith("metadata:")) {
      insertAt = i + 1;
      break;
    }
  }
  if (!nextLines.some((line) => line.startsWith("metadata:"))) {
    nextLines.push("metadata:");
    insertAt = nextLines.length;
  }
  nextLines.splice(insertAt, 0, rendered);
  return joinDoc(nextLines, body);
}

export function setTopLevelField(markdown: string, key: "name" | "description", value: string): string {
  const { rawFrontmatter, body, lines } = splitFrontmatter(markdown);
  if (lines.length === 0 && rawFrontmatter === "") {
    return markdown;
  }
  const nextLines = [...lines];
  const pattern = new RegExp(`^${key}:`);
  const index = nextLines.findIndex((line) => pattern.test(line));
  const rendered = `${key}: ${quoteYamlValue(value)}`;
  if (index >= 0) {
    nextLines[index] = rendered;
    return joinDoc(nextLines, body);
  }
  nextLines.unshift(rendered);
  return joinDoc(nextLines, body);
}

export function replaceBody(markdown: string, body: string): string {
  const { lines } = splitFrontmatter(markdown);
  return joinDoc(lines, body);
}

export function renderNewTaskDoc(input: {
  name: string;
  description: string;
  title: string;
  status: TaskStatus;
  assignee?: string;
  updatedAt: string;
  body: string;
}): string {
  const lines = [
    `name: ${input.name}`,
    `description: ${input.description}`,
    "metadata:",
    "  edges-type: task",
    `  edges-title: ${quoteYamlValue(input.title)}`,
    `  edges-tasks-status: ${input.status}`,
  ];
  if (input.assignee) {
    lines.push(`  edges-task-assignee: ${quoteYamlValue(input.assignee)}`);
  }
  lines.push(`  edges-updated-at: ${quoteYamlValue(input.updatedAt)}`);
  return joinDoc(lines, input.body);
}
