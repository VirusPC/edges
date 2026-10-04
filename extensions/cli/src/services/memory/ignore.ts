import { spawnSync } from "node:child_process";
import { relative } from "node:path";

/** Check real Git precedence for exact private paths, including not-yet-created files. */
export function assertPrivateIgnored(
  root: string,
  files: readonly string[],
  directories: readonly string[] = [],
): void {
  const repository = spawnSync("git", ["-C", root, "rev-parse", "--show-toplevel"], {
    encoding: "utf8",
  });
  if (repository.error) throw new Error("private-ignore-check-failed: " + repository.error.message);
  if (repository.status !== 0) return; // Ordinary non-Git directories remain supported.
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
