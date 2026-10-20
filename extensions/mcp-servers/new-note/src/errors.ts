import type { IngestErrorCode } from "./types.js";

const KNOWN_CODES: ReadonlySet<string> = new Set([
  "VALIDATION_ERROR",
  "SCRIPT_NOT_FOUND",
  "GIT_FAILURE",
  "PUSH_AUTH_FAILED",
  "PR_CREATION_UNAVAILABLE",
  "UNKNOWN_ERROR",
]);

export function classifyError(output: {
  stdout?: string;
  stderr?: string;
  message?: string;
  code?: string | number;
}): IngestErrorCode {
  if (output.code === "ENOENT" || output.code === "ERR_MODULE_NOT_FOUND") {
    return "SCRIPT_NOT_FOUND";
  }

  if (output.stdout) {
    try {
      const parsed = JSON.parse(output.stdout) as { errorCode?: string };
      if (parsed.errorCode && KNOWN_CODES.has(parsed.errorCode)) {
        return parsed.errorCode as IngestErrorCode;
      }
    } catch {
      // stdout is not CLI JSON
    }
  }

  const text = [output.stdout, output.stderr, output.message].filter(Boolean).join("\n").toLowerCase();

  if (text.includes("usage: new-note") || text.includes("validation")) {
    return "VALIDATION_ERROR";
  }
  if (
    (text.includes("enoent") && (text.includes("edges") || text.includes("cli"))) ||
    text.includes("cannot find module") ||
    text.includes("err_module_not_found")
  ) {
    return "SCRIPT_NOT_FOUND";
  }
  if (text.includes("permission denied (publickey)") || text.includes("authentication failed")) {
    return "PUSH_AUTH_FAILED";
  }
  if (text.includes("git push") || text.includes("could not read from remote repository")) {
    return "GIT_FAILURE";
  }

  return "UNKNOWN_ERROR";
}

export function summarize(text: string | undefined, maxLen = 400): string | undefined {
  if (!text) {
    return undefined;
  }
  const singleLine = text.replace(/\s+/g, " ").trim();
  if (singleLine.length <= maxLen) {
    return singleLine;
  }
  return `${singleLine.slice(0, maxLen)}...`;
}
