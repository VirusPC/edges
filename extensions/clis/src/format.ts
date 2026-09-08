import type { IngestResult } from "./types.js";

export function formatResult(result: IngestResult): string {
  if (result.status === "success") {
    const { diagnostics: _diagnostics, ...payload } = result;
    return `${JSON.stringify(payload)}\n`;
  }
  return `${JSON.stringify(result)}\n`;
}
