import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { portableScope, resolveScope } from "../scope.js";
import { createNodeBoardFs } from "./board.js";
import { groupedListToReviewPageInput, listGroupedByProject, listRepositoryGroupedByProject } from "./grouped.js";
import { taskBoardLocation, type TaskPurpose } from "./paths.js";
import { loadBuiltReviewShell, parseReviewPageInput, renderReviewPageHtml } from "./review-page.js";
import { TasksError } from "../../domain/models/tasks/types.js";

export const DEFAULT_TASKS_SITE_REL = "tasks/_site/index.html";
export function defaultTasksSiteOutPath(scopeDir: string): string { return path.join(scopeDir, DEFAULT_TASKS_SITE_REL); }
export function findEdgesRepo(startDir: string, env: NodeJS.ProcessEnv = process.env): string { return resolveScope(env, startDir); }

export async function generateTasksSite(input: {
  repoPath: string;
  outPath: string;
  purpose?: TaskPurpose | "all";
  env?: NodeJS.ProcessEnv;
}): Promise<{ path: string; groupCount: number; itemCount: number }> {
  const purpose = input.purpose ?? "domain";
  if (!["domain", "maintenance", "all"].includes(purpose)) throw new TasksError("VALIDATION_ERROR", "purpose must be domain, maintenance, or all");
  const location = taskBoardLocation(input.repoPath, purpose === 'all' ? 'domain' : purpose);
  const grouped = purpose === 'all'
    ? await listRepositoryGroupedByProject(input.repoPath)
    : await listGroupedByProject(location, {}, createNodeBoardFs(location), portableScope(input.repoPath, input.repoPath));
  const page = parseReviewPageInput(groupedListToReviewPageInput(grouped));
  const shell = await loadBuiltReviewShell(abs => readFile(abs, "utf8"));
  const outPath = path.resolve(input.outPath);
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, renderReviewPageHtml(page, shell), "utf8");
  return { path: outPath, groupCount: page.groups.length, itemCount: page.items.length };
}
