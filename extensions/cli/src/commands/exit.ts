export function exitCodeForErrorCode(errorCode: string): number {
  if (errorCode === "VALIDATION_ERROR") return 2;
  if (errorCode.startsWith("AUTH_")) return 4;
  return 1;
}
