import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { discoverScopes, portableScope, resolveScope } from "../../utils/scope.js";
import { createNodeBoardFs } from "./board.js";
import { groupedListToReviewPageInput, listGroupedByProject, GROUPED_LIST_SCHEMA, type GroupedList } from "./grouped.js";
import { taskBoardLocation, type TaskPurpose } from "./paths.js";
import { loadBuiltReviewShell, parseReviewPageInput, renderReviewPageHtml } from "./review-page.js";
import { TasksError } from "./types.js";

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
  const grouped: GroupedList = { schema: GROUPED_LIST_SCHEMA, groups: [], items: [] };
  for (const scope of purpose === "all" ? discoverScopes(input.repoPath) : [input.repoPath]) {
    for (const selected of purpose === "all" ? ["domain", "maintenance"] as const : [purpose]) {
      const location = taskBoardLocation(scope, selected);
      const board = await listGroupedByProject(location, {}, createNodeBoardFs(location), portableScope(scope, input.repoPath));
      grouped.groups.push(...board.groups);
      grouped.items.push(...board.items);
    }
  }
  const page = parseReviewPageInput(groupedListToReviewPageInput(grouped));
  const shell = await loadBuiltReviewShell(abs => readFile(abs, "utf8"));
  const outPath = path.resolve(input.outPath);
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, renderReviewPageHtml(page, shell), "utf8");
  return { path: outPath, groupCount: page.groups.length, itemCount: page.items.length };
}
