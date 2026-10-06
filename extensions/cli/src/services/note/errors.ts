import type { IngestErrorCode } from "./types.js";

export function classifyError(output: {
  stdout?: string;
  stderr?: string;
  message?: string;
  code?: string | number;
}): IngestErrorCode {
  if (output.code === "ENOENT") {
    return "GIT_FAILURE";
  }

  const text = [output.stdout, output.stderr, output.message].filter(Boolean).join("\n").toLowerCase();

  if (text.includes("usage: new-note") || text.includes("validation")) {
    return "VALIDATION_ERROR";
  }
  if (text.includes("permission denied (publickey)") || text.includes("authentication failed")) {
    return "PUSH_AUTH_FAILED";
  }
  if (text.includes("git push") || text.includes("could not read from remote repository") || text.includes("spawn git")) {
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
