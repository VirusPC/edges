import { spawnSync } from "node:child_process";
import { lstatSync, realpathSync } from "node:fs";
import { dirname, join, relative } from "node:path";

function hasRepositoryContext(root: string): boolean {
  if (["GIT_DIR", "GIT_WORK_TREE", "GIT_COMMON_DIR"].some(key => process.env[key] !== undefined)) return true;
  const present = (file: string): boolean => {
    try { lstatSync(file); return true; }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
      throw error;
    }
  };
  // Inspect physical ancestors so a worktree file, broken link, or damaged Git
  // directory cannot turn a failed Git invocation into permission to write.
  for (let directory = realpathSync(root); ; directory = dirname(directory)) {
    if (present(join(directory, ".git"))) return true;
    if (present(join(directory, "HEAD")) && present(join(directory, "objects"))) return true;
    if (dirname(directory) === directory) return false;
  }
}

/** Check real Git precedence for exact private paths, including not-yet-created files. */
export function assertPrivateIgnored(
  root: string,
  files: readonly string[],
  directories: readonly string[] = [],
): void {
  const repository = spawnSync("git", ["-C", root, "rev-parse", "--git-dir"], {
    encoding: "utf8",
  });
  if (repository.error || repository.status !== 0) {
    try {
      if (!hasRepositoryContext(root)) return; // Confirmed non-Git, including absent Git binary.
    } catch (error) {
      throw new Error("private-ignore-check-failed: " + (error as Error).message);
    }
    throw new Error("private-ignore-check-failed: " +
      (repository.error?.message ?? (repository.stderr.trim() || "Git repository discovery failed")));
  }
  const paths = [...new Set([...files, ...directories.map(directory => directory.replace(/\/$/, "") + "/")])];
  if (!paths.length) return;
  const result = spawnSync("git", ["-C", root, "check-ignore", "--no-index", "-z", "--stdin"], {
    input: paths.join("\0") + "\0",
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.error || (result.status !== 0 && result.status !== 1))
    throw new Error("private-ignore-check-failed: " + (result.error?.message ?? result.stderr.trim()));
  const ignored = new Set(result.stdout.split("\0"));
  const exposed = paths.find(file => !ignored.has(file));
  if (exposed) throw new Error("private-ignore-coverage-failed: " + relative(root, exposed));
}
