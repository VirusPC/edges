import { Command, CommanderError } from "commander";
import { createProgram, type IngestCliOptions } from "./program.js";
import type { IngestErrorCode } from "./types.js";

function applyExitOverride(cmd: Command): void {
  cmd.exitOverride();
  for (const child of cmd.commands) {
    applyExitOverride(child);
  }
}

export type ParseOk =
  | { kind: "help"; text: string }
  | { kind: "version" }
  | {
      kind: "note";
      title: string;
      content: string;
      coAuthor: string;
      dryRun: boolean;
      mode?: "pr" | "direct";
      tokenFile?: string;
      tokenStdin: boolean;
    }
  | { kind: "tasks" };

export type ParseFail = {
  kind: "error";
  errorCode: IngestErrorCode;
  reason: string;
};

export type ParseResult = ParseOk | ParseFail;

function validationError(reason: string): ParseFail {
  return { kind: "error", errorCode: "VALIDATION_ERROR", reason };
}

function fromNoteOptions(opts: IngestCliOptions): ParseResult {
  const mode = opts.mode;
  if (mode !== undefined && mode !== "pr" && mode !== "direct") {
    return validationError('--mode must be "direct" or "pr"');
  }

  if (opts.tokenFile && opts.tokenStdin) {
    return validationError("use only one of --token-file or --token-stdin");
  }

  const title = opts.title;
  const content = opts.content;
  const coAuthor = opts.coAuthor;
  const missing: string[] = [];
  if (!title) missing.push("--title");
  if (!content) missing.push("--content");
  if (!coAuthor) missing.push("--co-author");
  if (missing.length > 0 || !title || !content || !coAuthor) {
    return validationError(
      `missing required flags: ${missing.join(", ") || "--title, --content, --co-author"}`,
    );
  }

  return {
    kind: "note",
    title,
    content,
    coAuthor,
    dryRun: opts.dryRun === true,
    mode,
    tokenFile: opts.tokenFile,
    tokenStdin: opts.tokenStdin === true,
  };
}

export function parseArgv(argv: string[]): ParseResult {
  let collected: IngestCliOptions | undefined;
  let sawTasks = false;
  let sawMissingCommand = false;
  let output = "";
  const program = createProgram(
    {
      onNote: (opts) => {
        collected = opts;
      },
      onTasks: () => {
        sawTasks = true;
      },
      onMissingCommand: () => {
        sawMissingCommand = true;
      },
    },
    {
      writeOut: (str) => {
        output += str;
      },
      writeErr: (str) => {
        output += str;
      },
    },
  );
  applyExitOverride(program);

  if (argv[0] === "ingest") {
    return validationError("ingest was renamed to note. Use: edges note …");
  }

  try {
    program.parse(argv, { from: "user" });
  } catch (err) {
    if (err instanceof CommanderError) {
      if (err.code === "commander.helpDisplayed" || err.code === "commander.help") {
        return { kind: "help", text: output };
      }
      if (err.code === "commander.version") {
        return { kind: "version" };
      }
      const reason = err.message.replace(/^error:\s*/i, "");
      return validationError(reason);
    }
    const message = err instanceof Error ? err.message : String(err);
    return validationError(message);
  }

  if (sawTasks) {
    return { kind: "tasks" };
  }
  if (sawMissingCommand) {
    return validationError("missing command. Use edges --help.");
  }
  if (!collected) {
    return validationError("missing command. Use edges --help.");
  }

  return fromNoteOptions(collected);
}
