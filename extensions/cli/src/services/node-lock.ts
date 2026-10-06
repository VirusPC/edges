/** Cooperative command lock. Metadata discovery deliberately does not parse nodes. */
import fs from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import lockfile from "proper-lockfile";

function metadata(file: string): fs.Stats | undefined {
  try {
    return fs.lstatSync(file);
  } catch (error) {
    if (
      ["ENOENT", "ENOTDIR"].includes(
        (error as NodeJS.ErrnoException).code ?? "",
      )
    )
      return undefined;
    throw error;
  }
}
function canonical(file: string): string {
  if (metadata(file)) return fs.realpathSync(file);
  const parent = path.dirname(file);
  return parent === file
    ? file
    : path.join(canonical(parent), path.basename(file));
}
/** Reserved runtime artifact, never a node resource or imported attachment. */
export const WRITE_LOCK_NAME = ".edges-write.lock";
/** Git worktrees keep their lock locally; one fixed temporary lock serializes
 * non-Git writers even when init creates ancestor scope markers. */
export function writeLockPath(target: string): string {
  target = canonical(path.resolve(target));
  for (let current = target; ; current = path.dirname(current)) {
    if (metadata(path.join(current, ".git")))
      return path.join(current, WRITE_LOCK_NAME);
    if (path.dirname(current) === current)
      return path.join(fs.realpathSync(tmpdir()), WRITE_LOCK_NAME);
  }
}
/** A directory rename/removal must not carry away a lock held by another command. */
export function assertNoWriteLock(file: string): void {
  if (!metadata(file)?.isDirectory()) return;
  for (const name of fs.readdirSync(file)) {
    if (name === WRITE_LOCK_NAME)
      throw new Error(
        `Cannot relocate or destroy unit with active node write lock: ${path.join(file, name)}`,
      );
    assertNoWriteLock(path.join(file, name));
  }
}
/** Fail immediately on contention. proper-lockfile's default compromised handler
 * throws, terminating the command instead of allowing work after heartbeat loss. */
export async function acquireWriteLock(
  target: string,
): Promise<() => Promise<void>> {
  const lockPath = writeLockPath(target);
  try {
    return await lockfile.lock(lockPath, {
      realpath: false,
      lockfilePath: lockPath,
      retries: 0,
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ELOCKED")
      throw new Error(`Node write lock busy: ${lockPath}`, { cause: error });
    throw error;
  }
}
