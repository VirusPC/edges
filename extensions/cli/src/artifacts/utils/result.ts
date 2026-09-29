import type { CliContext, CliResult } from "../../context.js";

export type ArtifactsErrorCode =
  | "VALIDATION_ERROR"
  | "AUTH_MISSING"
  | "AUTH_INVALID_FORMAT"
  | "AUTH_INVALID_TOKEN"
  | "UNKNOWN_ERROR";

export class ArtifactsError extends Error {
  readonly errorCode: ArtifactsErrorCode;

  constructor(errorCode: ArtifactsErrorCode, message: string) {
    super(message);
    this.errorCode = errorCode;
  }
}

export function fail(errorCode: ArtifactsErrorCode, reason: string): CliResult {
  return {
    exitCode: errorCode === "VALIDATION_ERROR" ? 2 : errorCode.startsWith("AUTH_") ? 4 : 1,
    stdout: `${JSON.stringify({ status: "failed", errorCode, reason })}\n`,
    stderr: "See edges artifacts --help for usage.\n",
  };
}

export function succeed(payload: Record<string, unknown>, stderr = ""): CliResult {
  return {
    exitCode: 0,
    stdout: `${JSON.stringify({ status: "success", ...payload })}\n`,
    stderr,
  };
}

export async function runArtifactsCommand(
  ctx: CliContext,
  fn: () => Promise<CliResult>,
): Promise<void> {
  try {
    ctx.result = await fn();
  } catch (error) {
    if (error instanceof ArtifactsError) {
      ctx.result = fail(error.errorCode, error.message);
      return;
    }
    if (error && typeof error === "object" && "errorCode" in error) {
      const code = (error as { errorCode: ArtifactsErrorCode }).errorCode;
      const message = error instanceof Error ? error.message : String(error);
      ctx.result = fail(code, message);
      return;
    }
    const message = error instanceof Error ? error.message : String(error);
    ctx.result = fail("UNKNOWN_ERROR", message);
  }
}
