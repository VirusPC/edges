import type { IngestErrorCode, IngestResult } from "./types.js";

export function exitCodeFor(result: IngestResult): number {
  if (result.status === "success") {
    return 0;
  }
  return exitCodeForError(result.errorCode);
}

export function exitCodeForError(errorCode: IngestErrorCode): number {
  switch (errorCode) {
    case "VALIDATION_ERROR":
      return 2;
    case "AUTH_MISSING":
    case "AUTH_INVALID_FORMAT":
    case "AUTH_INVALID_TOKEN":
      return 4;
    default:
      return 1;
  }
}
