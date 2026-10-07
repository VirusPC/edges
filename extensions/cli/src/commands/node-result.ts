import type { CliContext } from "../context.js";
import { fail } from "./result.js";

const VALIDATION = /not found|must be|ambiguous|already exists|filter must be|metadata must be|owning scope/;

/** Map a node use-case error onto the CLI result. Help text stays command-specific. */
export function failNodeCommand(ctx: CliContext, error: unknown, help: string): void {
  const message = error instanceof Error ? error.message : String(error);
  ctx.result = fail(VALIDATION.test(message) ? "VALIDATION_ERROR" : "UNKNOWN_ERROR", message, help);
}
