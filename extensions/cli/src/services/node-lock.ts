/** Cooperative command lock. Metadata discovery deliberately does not parse nodes. */
import fs from "node:fs";
import path from "node:path";
import { tmpdir, homedir } from "node:os";
import { createHash } from "node:crypto";
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
/** Nearest Git boundary wins; otherwise all physical AGENTS ancestors share the
 * outermost owner. Missing explicit targets retain their suffix when canonicalized. */
export function writeLockRoot(target: string): string {
  target = canonical(
    path.resolve(
      target.startsWith("~/") ? path.join(homedir(), target.slice(2)) : target,
    ),
  );
  let owner: string | undefined;
  for (let current = target; ; current = path.dirname(current)) {
    if (metadata(path.join(current, ".git"))) return current;
    if (metadata(path.join(current, "AGENTS.md"))?.isFile()) owner = current;
    if (path.dirname(current) === current) break;
  }
  return owner ?? target;
}
/** Fail immediately on contention. proper-lockfile's default compromised handler
 * throws, terminating the command instead of allowing work after heartbeat loss. */
export async function acquireWriteLock(
  target: string,
): Promise<() => Promise<void>> {
  const root = writeLockRoot(target);
  const directory = path.join(
    fs.realpathSync(tmpdir()),
    "edges-node-write-locks",
  );
  fs.mkdirSync(directory, { recursive: true });
  const lockPath = path.join(
    directory,
    createHash("sha256").update(root).digest("hex") + ".lock",
  );
  try {
    return await lockfile.lock(root, {
      realpath: false,
      lockfilePath: lockPath,
      retries: 0,
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ELOCKED")
      throw new Error(`Node write lock busy: ${root}`, { cause: error });
    throw error;
  }
}
