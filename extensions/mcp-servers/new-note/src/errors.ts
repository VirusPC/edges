import type { IngestErrorCode } from "./types.js";

export function classifyError(output: { stdout?: string; stderr?: string; message?: string }): IngestErrorCode {
  const text = [output.stdout, output.stderr, output.message].filter(Boolean).join("\n").toLowerCase();

  if (text.includes("usage: new-note") || text.includes("validation")) {
    return "VALIDATION_ERROR";
  }
  if (text.includes("no such file") && text.includes("new-note")) {
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
