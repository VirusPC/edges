import { mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { run } from "../../program.js";
import { groupedListToReviewPageInput, parseGroupedList } from "./grouped.js";
import { TasksError } from "./types.js";

export const DEFAULT_TASKS_SITE_REL = "knowledge/tasks/_site/index.html";

export function defaultTasksSiteOutPath(repoPath: string): string {
  return path.join(repoPath, DEFAULT_TASKS_SITE_REL);
}

export function findEdgesRepo(startDir: string, env: NodeJS.ProcessEnv = process.env): string {
  const fromEnv = env.EDGES_REPO?.trim();
  if (fromEnv) {
    return path.resolve(fromEnv);
  }
  let dir = path.resolve(startDir);
  while (true) {
    if (existsSync(path.join(dir, "knowledge/tasks"))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      throw new TasksError("BOARD_IO_ERROR", "could not find a directory containing knowledge/tasks");
    }
    dir = parent;
  }
}

function boardIoFailure(step: string, result: { stdout: string; stderr: string }): never {
  const detail = result.stderr.trim() || result.stdout.trim() || `${step} failed`;
  throw new TasksError("BOARD_IO_ERROR", detail);
}

export async function generateTasksSite(input: {
  repoPath: string;
  outPath: string;
  env?: NodeJS.ProcessEnv;
}): Promise<{ path: string; groupCount: number; itemCount: number }> {
  const env = { ...process.env, ...input.env, EDGES_REPO: input.repoPath };
  const listed = await run(["tasks", "list", "--group-by", "project", "--format", "json"], { env });
  if (listed.exitCode !== 0) {
    boardIoFailure("list --group-by project", listed);
  }
  let raw: unknown;
  try {
    raw = JSON.parse(listed.stdout);
  } catch {
    throw new TasksError("BOARD_IO_ERROR", "list --group-by project did not emit JSON");
  }
  const page = groupedListToReviewPageInput(parseGroupedList(raw));
  const outPath = path.resolve(input.outPath);
  await mkdir(path.dirname(outPath), { recursive: true });
  const rendered = await run(["tasks", "project", "review-page", "--from", "-", "--out", outPath], {
    env,
    stdinText: JSON.stringify(page),
  });
  if (rendered.exitCode !== 0) {
    boardIoFailure("project review-page", rendered);
  }
  let body: { path?: string; groupCount?: number; itemCount?: number };
  try {
    body = JSON.parse(rendered.stdout) as { path?: string; groupCount?: number; itemCount?: number };
  } catch {
    throw new TasksError("BOARD_IO_ERROR", "project review-page did not emit JSON");
  }
  return {
    path: body.path ?? outPath,
    groupCount: body.groupCount ?? page.groups.length,
    itemCount: body.itemCount ?? page.items.length,
  };
}
