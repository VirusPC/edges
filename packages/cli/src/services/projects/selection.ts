import { leafEntryPath } from "../node/entry-path.js";
import path from "node:path";
import { lstatSync } from "node:fs";
import { placeHarnessMaterial } from "../../domain/config/edges-materials.js";
import { ProjectNode } from "../../domain/models/projects/project-node.js";
import { firstSymlink, isWithinPath } from "../../utils/filesystem.js";
import { NodeService } from "../node/node-service.js";

export type ProjectSelectionOptions = { super?: boolean };

/** Projects collection for one material face: `<scope>/.edges/projects`, or `<scope>/projects` with --super. */
export function projectsCollectionRoot(scope: string, options: ProjectSelectionOptions = {}): string {
  return path.dirname(placeHarnessMaterial(scope, "projects", { super: options.super === true }).absPath);
}

/** P or P/projects/Q, relative to the projects collection that actually contains the directory. */
export function relativeProjectPath(scope: string, projectDir: string): string {
  const roots = [false, true]
    .map((useSuper) => projectsCollectionRoot(scope, { super: useSuper }))
    .filter((root) => isWithinPath(projectDir, root))
    .sort((left, right) => right.length - left.length);
  return path.relative(roots[0] ?? projectsCollectionRoot(scope), projectDir).split(path.sep).join("/");
}

/** Resolve only real Project directories: P, P/projects/Q, and so on. */
export async function resolveProjectSelection(
  scope: string,
  value: string,
  options: ProjectSelectionOptions = {},
  service = new NodeService({ managedRoot: scope }),
): Promise<string> {
  const parts = value.split("/");
  const label = options.super === true ? "<scope>/projects" : "<scope>/.edges/projects";
  if (!value || path.isAbsolute(value) || value.includes("\\") || parts.some((part) => !part || part === "." || part === "..") || parts.length % 2 !== 1 || parts.some((part, i) => i % 2 === 1 && part !== "projects")) {
    throw new Error(`--project must be a relative Project directory under ${label} (P or P/projects/Q).`);
  }
  const root = projectsCollectionRoot(scope, options);
  const target = path.resolve(root, value);
  if (!isWithinPath(target, root) || firstSymlink(target, scope)) {
    throw new Error("--project must stay within the scope without symbolic links.");
  }
  // Check each parent too: an arbitrary directory containing projects/Q is not a Project.
  for (let i = 1; i <= parts.length; i += 2) {
    const file = leafEntryPath(path.join(root, ...parts.slice(0, i)));
    let regular = false;
    try { regular = lstatSync(file).isFile(); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    if (!regular || firstSymlink(file, scope) || !(await service.get(file) instanceof ProjectNode)) {
      throw new Error(`Project not found: ${parts.slice(0, i).join("/")}`);
    }
  }
  return target;
}
