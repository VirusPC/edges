import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { resolveScope } from "../scope.js";
import { listRepositoryTasksWithDocs } from "./board.js";
import { loadBuiltReviewShell, parseReviewPageInput, renderReviewPageHtml } from "./review-page.js";
import { listRepositoryGroupedByProject, groupedListToReviewPageInput } from "./grouped.js";
import { fieldText } from "../list-query.js";

export const DEFAULT_TASKS_SITE_REL = "tasks/_site/index.html";
export function defaultTasksSiteOutPath(scopeDir: string): string { return path.join(scopeDir, DEFAULT_TASKS_SITE_REL); }
export function findEdgesRepo(startDir: string, env: NodeJS.ProcessEnv = process.env): string { return resolveScope(env, startDir); }

export async function generateTasksSite(input: {
  repoPath: string;
  outPath: string;
  env?: NodeJS.ProcessEnv;
}): Promise<{ path: string; groupCount: number; itemCount: number }> {
  const page = groupedListToReviewPageInput(await listRepositoryGroupedByProject(input.repoPath));
  const shell = await loadBuiltReviewShell(abs => readFile(abs, "utf8"));
  const outPath = path.resolve(input.outPath);
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, renderReviewPageHtml(page, shell), "utf8");
  return { path: outPath, groupCount: page.groups.length, itemCount: page.items.length };
}
