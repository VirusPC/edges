import type { CliContext, CliResult } from "../../../context.js";
import { exitCodeForErrorCode } from "../../exit.js";
import {
  ArtifactsError,
  type ArtifactsErrorCode,
} from "../../../services/artifacts/error.js";

export { ArtifactsError, type ArtifactsErrorCode };

export function fail(errorCode: ArtifactsErrorCode, reason: string): CliResult {
  return {
    exitCode: exitCodeForErrorCode(errorCode),
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
