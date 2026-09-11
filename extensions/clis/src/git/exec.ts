import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type ExecResult = { stdout: string; stderr: string };
export type ExecFn = (
  file: string,
  args: string[],
  options?: { cwd?: string; env?: NodeJS.ProcessEnv },
) => Promise<ExecResult>;

export function createExecFile(): ExecFn {
  return async (file, args, options = {}) => {
    const result = await execFileAsync(file, args, {
      cwd: options.cwd,
      env: options.env,
      encoding: "utf8",
      maxBuffer: 1024 * 1024 * 10,
    });
    return { stdout: result.stdout, stderr: result.stderr };
  };
}
