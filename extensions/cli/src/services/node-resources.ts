/** Physical resources are opaque bytes, never inferred logical children. */
import * as fs from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { checkPath } from "./node-files.js";
export interface ResourceSnapshot {
  root: string;
  entries: Map<string, string>;
}
export function resourceSnapshot(
  root: string,
  linkedRead = false,
): ResourceSnapshot {
  checkPath(root, linkedRead);
  const entries = new Map<string, string>();
  const physicalRoot = linkedRead ? fs.realpathSync(root) : root;
  function visit(file: string) {
    const stat = fs.lstatSync(file),
      relative = path.relative(physicalRoot, file);
    const identity = `${stat.dev}:${stat.ino}:${stat.mode}`;
    if (stat.isSymbolicLink()) {
      entries.set(relative, `${identity}:link:${fs.readlinkSync(file)}`);
      return;
    }
    if (stat.isDirectory()) {
      entries.set(relative, `${identity}:directory`);
      for (const name of fs.readdirSync(file).sort())
        visit(path.join(file, name));
    } else if (stat.isFile()) {
      const fd = fs.openSync(
        file,
        fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW,
      );
      try {
        const opened = fs.fstatSync(fd);
        if (opened.ino !== stat.ino || opened.dev !== stat.dev)
          throw new Error(`Resource identity changed: ${file}`);
        entries.set(
          relative,
          `${identity}:file:${createHash("sha256").update(fs.readFileSync(fd)).digest("hex")}`,
        );
      } finally {
        fs.closeSync(fd);
      }
    } else throw new Error(`Unsupported node resource: ${file}`);
  }
  visit(physicalRoot);
  return { root, entries };
}
export function validateResources(before: ResourceSnapshot): void {
  let current: ResourceSnapshot;
  try {
    current = resourceSnapshot(before.root);
  } catch (cause) {
    throw new Error(`Node resources changed: ${before.root}`, { cause });
  }
  if (
    JSON.stringify([...before.entries]) !== JSON.stringify([...current.entries])
  )
    throw new Error(
      `Node resources changed; reload before saving: ${before.root}`,
    );
}
export function recoveryPath(root: string): string {
  return path.join(path.dirname(root), `.node-recovery-${randomUUID()}`);
}
