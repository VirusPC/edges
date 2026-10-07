import type { CliContext, CliResult } from "../../context.js";
import { asTasksError, openTasksRuntime } from "../../services/tasks/result.js";
import { fail, succeed } from "../result.js";

export { succeed };

export function failTask(errorCode: string, reason: string) {
  return fail(errorCode, reason, "See edges tasks --help for usage.\n");
}

/**
 * Run a tasks subcommand: open the board from env, run the body,
 * and store the result on `ctx`.
 */
export async function runTasksCommand(
  ctx: CliContext,
  fn: (runtime: ReturnType<typeof openTasksRuntime>) => Promise<CliResult>,
): Promise<void> {
  try {
    ctx.result = await fn(openTasksRuntime({
      env: ctx.env,
      super: ctx.super,
    }));
  } catch (error) {
    const mapped = asTasksError(error);
    ctx.result = failTask(mapped.errorCode, mapped.message);
  }
}
