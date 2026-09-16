import path from "node:path";
import { projectDirName } from "./project.js";
import { TASK_STATUSES, type TaskProjectId, type TaskStatus } from "./types.js";

export function isTaskStatus(value: string): value is TaskStatus {
  return TASK_STATUSES.includes(value as TaskStatus);
}

export function boardRoot(repoPath: string): string {
  return path.join(repoPath, "knowledge/tasks");
}

export function statusDir(repoPath: string, project: TaskProjectId, status: TaskStatus): string {
  return path.join(boardRoot(repoPath), projectDirName(project), status);
}

export function taskRelPath(project: TaskProjectId, status: TaskStatus, stem: string): string {
  return path.join("knowledge/tasks", projectDirName(project), status, `${stem}.md`);
}

export function sidecarRelPath(project: TaskProjectId, status: TaskStatus, stem: string): string {
  return path.join("knowledge/tasks", projectDirName(project), status, `.${stem}.log.md`);
}

export function stemFromFilename(name: string): string | undefined {
  if (!isTaskMarkdownName(name)) {
    return undefined;
  }
  return name.slice(0, -".md".length);
}

export function isTaskMarkdownName(name: string): boolean {
  if (!name.endsWith(".md")) {
    return false;
  }
  if (name.startsWith(".") && name.endsWith(".log.md")) {
    return false;
  }
  if (name === "AGENTS.md" || name === "README.md") {
    return false;
  }
  return true;
}

export function parseTarget(target: string): { kind: "stem"; stem: string } | { kind: "path"; stem: string } {
  const base = path.basename(target);
  if (target.includes("/") && base.endsWith(".md")) {
    return { kind: "path", stem: base.slice(0, -".md".length) };
  }
  if (base.endsWith(".md") && target !== base) {
    return { kind: "path", stem: base.slice(0, -".md".length) };
  }
  if (target.endsWith(".md") && (target.includes("/") || target.includes("\\"))) {
    return { kind: "path", stem: base.slice(0, -".md".length) };
  }
  if (target.includes("/") || target.includes("\\")) {
    const stem = base.endsWith(".md") ? base.slice(0, -".md".length) : base;
    return { kind: "path", stem };
  }
  const stem = target.endsWith(".md") ? target.slice(0, -".md".length) : target;
  return { kind: "stem", stem };
}
