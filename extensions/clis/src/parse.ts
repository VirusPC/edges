import { parseArgs } from "node:util";
import type { IngestErrorCode } from "./types.js";

export type ParseOk =
  | { kind: "help" }
  | { kind: "version" }
  | {
      kind: "ingest";
      title: string;
      content: string;
      coAuthor: string;
      dryRun: boolean;
      mode?: "pr" | "direct";
      tokenFile?: string;
      tokenStdin: boolean;
    };

export type ParseFail = {
  kind: "error";
  errorCode: IngestErrorCode;
  reason: string;
};

export type ParseResult = ParseOk | ParseFail;

export function parseArgv(argv: string[]): ParseResult {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      options: {
        title: { type: "string" },
        content: { type: "string" },
        "co-author": { type: "string" },
        json: { type: "boolean", default: false },
        "dry-run": { type: "boolean", default: false },
        mode: { type: "string" },
        "token-file": { type: "string" },
        "token-stdin": { type: "boolean", default: false },
        help: { type: "boolean", short: "h", default: false },
        version: { type: "boolean", short: "v", default: false },
      },
      strict: true,
      allowPositionals: true,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { kind: "error", errorCode: "VALIDATION_ERROR", reason: message };
  }

  if (parsed.values.help) {
    return { kind: "help" };
  }
  if (parsed.values.version) {
    return { kind: "version" };
  }

  if (parsed.positionals.length > 0) {
    return {
      kind: "error",
      errorCode: "VALIDATION_ERROR",
      reason: `unexpected positional arguments: ${parsed.positionals.join(" ")}. Use --title, --content, and --co-author.`,
    };
  }

  const mode = parsed.values.mode;
  if (mode !== undefined && mode !== "pr" && mode !== "direct") {
    return { kind: "error", errorCode: "VALIDATION_ERROR", reason: '--mode must be "direct" or "pr"' };
  }

  if (parsed.values["token-file"] && parsed.values["token-stdin"]) {
    return {
      kind: "error",
      errorCode: "VALIDATION_ERROR",
      reason: "use only one of --token-file or --token-stdin",
    };
  }

  const title = parsed.values.title;
  const content = parsed.values.content;
  const coAuthor = parsed.values["co-author"];
  const missing: string[] = [];
  if (!title) missing.push("--title");
  if (!content) missing.push("--content");
  if (!coAuthor) missing.push("--co-author");
  if (missing.length > 0 || !title || !content || !coAuthor) {
    return {
      kind: "error",
      errorCode: "VALIDATION_ERROR",
      reason: `missing required flags: ${missing.join(", ") || "--title, --content, --co-author"}`,
    };
  }

  return {
    kind: "ingest",
    title,
    content,
    coAuthor,
    dryRun: parsed.values["dry-run"] === true,
    mode: mode as "pr" | "direct" | undefined,
    tokenFile: parsed.values["token-file"],
    tokenStdin: parsed.values["token-stdin"] === true,
  };
}
