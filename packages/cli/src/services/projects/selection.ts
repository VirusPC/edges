import path from "node:path";
import { lstatSync } from "node:fs";
import { ProjectNode } from "../../domain/models/projects/project-node.js";
import { firstSymlink, isWithinPath } from "../../utils/filesystem.js";
import { NodeService } from "../node/node-service.js";

/** Resolve only real Project directories: P, P/projects/Q, and so on. */
export async function resolveProjectSelection(
  scope: string,
  value: string,
  service = new NodeService({ managedRoot: scope }),
): Promise<string> {
  const parts = value.split("/");
  if (!value || path.isAbsolute(value) || value.includes("\\") || parts.some((part) => !part || part === "." || part === "..") || parts.length % 2 !== 1 || parts.some((part, i) => i % 2 === 1 && part !== "projects")) {
    throw new Error("--project must be a relative Project directory under <scope>/.edges/projects (P or P/projects/Q).");
  }
  const root = path.join(scope, ".edges", "projects");
  const target = path.resolve(root, value);
  if (!isWithinPath(target, root) || firstSymlink(target, scope)) {
    throw new Error("--project must stay within the scope without symbolic links.");
  }
  // Check each parent too: an arbitrary directory containing projects/Q is not a Project.
  for (let i = 1; i <= parts.length; i += 2) {
    const file = path.join(root, ...parts.slice(0, i), "INDEX.md");
    let regular = false;
    try { regular = lstatSync(file).isFile(); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    if (!regular || firstSymlink(file, scope) || !(await service.get(file) instanceof ProjectNode)) {
      throw new Error(`Project not found: ${parts.slice(0, i).join("/")}`);
    }
  }
  return target;
}
