export type IngestErrorCode =
  | "VALIDATION_ERROR"
  | "SCRIPT_NOT_FOUND"
  | "GIT_FAILURE"
  | "PUSH_AUTH_FAILED"
  | "PR_CREATION_UNAVAILABLE"
  | "UNKNOWN_ERROR";

export interface IngestRequest {
  title: string;
  body: string;
}

export interface IngestSuccess {
  status: "success";
  path: string;
  title: string;
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
  repoPath?: string;
  cwd?: string;
  scopeDir?: string;
  baseBranch: string;
  cliEntry: string;
  skillsPath: string;
  mode: "pr" | "direct";
  dryRun: boolean;
  authToken?: string;
}

export interface ScriptSuccess {
  path: string;
  title: string;
  stdout: string;
}
