export type IngestErrorCode =
  | "VALIDATION_ERROR"
  | "SCRIPT_NOT_FOUND"
  | "GIT_FAILURE"
  | "PUSH_AUTH_FAILED"
  | "PR_CREATION_UNAVAILABLE"
  | "UNKNOWN_ERROR";

export interface IngestRequest {
  title: string;
  content: string;
  coAuthor: string;
}

export interface IngestSuccess {
  status: "success";
  filePath: string;
  branch: string;
  prUrl?: string;
  prStatus: "created" | "unavailable" | "direct_commit";
  stdoutSummary: string;
}

export interface IngestFailure {
  status: "failed";
  errorCode: IngestErrorCode;
  reason: string;
  stdoutSummary?: string;
  stderrSummary?: string;
}

export type IngestResult = IngestSuccess | IngestFailure;

export interface RuntimeConfig {
  repoPath: string;
  baseBranch: string;
  scriptPath: string;
  mode: "pr" | "direct";
  authToken?: string;
}

export interface ScriptSuccess {
  filePath: string;
  branch: string;
  prUrl?: string;
  prStatus: "created" | "unavailable" | "direct_commit";
  stdout: string;
}
