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
