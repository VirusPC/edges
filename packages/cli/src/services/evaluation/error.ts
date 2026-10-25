export type EvaluationErrorCode = "VALIDATION_ERROR" | "UNKNOWN_ERROR";

export class EvaluationError extends Error {
  readonly errorCode: EvaluationErrorCode;

  constructor(errorCode: EvaluationErrorCode, message: string) {
    super(message);
    this.name = "EvaluationError";
    this.errorCode = errorCode;
  }
}
