import type { CliContext } from "../context.js";
import { fail } from "./result.js";

const VALIDATION = /not found|must be|ambiguous|already exists|filter must be|metadata must be|owning scope/;

/** Error code for a node use-case message: validation-shaped messages exit 2, the rest exit 1. */
export function nodeErrorCode(message: string): "VALIDATION_ERROR" | "UNKNOWN_ERROR" {
  return VALIDATION.test(message) ? "VALIDATION_ERROR" : "UNKNOWN_ERROR";
}

/** Map a node use-case error onto the CLI result. Help text stays command-specific. */
export function failNodeCommand(ctx: CliContext, error: unknown, help: string): void {
  const message = error instanceof Error ? error.message : String(error);
  ctx.result = fail(nodeErrorCode(message), message, help);
}
