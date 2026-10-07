import { readFile } from "node:fs/promises";
import { Command, Option } from "commander";
import { ZodError } from "zod";
import { type CliContext, type CliResult, usageError } from "../../context.js";
import { loadConfig } from "../../services/config.js";
import { exitCodeForErrorCode } from "../exit.js";
import { checkAuth } from "../../services/note/auth.js";
import { formatResult } from "./format.js";
import { runNoteIngest } from "../../services/note/git/ingest.js";
import { runIngest } from "../../services/note/service.js";
import type { IngestFailure } from "../../services/note/types.js";
import { formatZodReason, validateInput } from "../../services/note/validation.js";

type IngestCliOptions = {
  title?: string;
  content?: string;
  contentFile?: string;
  markdown?: boolean;
  importEntry?: string;
  indexGroup?: "local" | "descendant";
  coAuthor?: string;
  json?: boolean;
  dryRun?: boolean;
  mode?: string;
  tokenFile?: string;
  tokenStdin?: boolean;
};

function fail(failure: IngestFailure): CliResult {
  return {
    exitCode: exitCodeForErrorCode(failure.errorCode),
    stdout: formatResult(failure),
    stderr: "",
  };
}

function validateNoteOptions(opts: IngestCliOptions):
  | CliResult
  | {
      title: string;
      content: string;
      coAuthor: string;
      dryRun: boolean;
      mode?: "pr" | "direct";
      tokenFile?: string;
      tokenStdin: boolean;
    } {
  const mode = opts.mode;
  if (mode !== undefined && mode !== "pr" && mode !== "direct") {
    return usageError('--mode must be "direct" or "pr"', "notes");
  }
  if (opts.tokenFile && opts.tokenStdin) {
    return usageError("use only one of --token-file or --token-stdin", "notes");
  }
  const title = opts.title;
  const content = opts.content;
  const coAuthor = opts.coAuthor;
  const missing: string[] = [];
  if (!title) missing.push("--title");
  if (!content) missing.push("--content");
  if (!coAuthor) missing.push("--co-author");
  if (!title || !content || !coAuthor) {
    return usageError(`missing required flags: ${missing.join(", ")}`, "notes");
  }
  return {
    title,
    content,
    coAuthor,
    dryRun: opts.dryRun === true,
    mode,
    tokenFile: opts.tokenFile,
    tokenStdin: opts.tokenStdin === true,
  };
}

/**
 * Auth flags (`--token-file`, `--token-stdin`) stay on `notes create` — same
 * optional gate as the new-note MCP HTTP server.
 */
export function addNoteCreateCommand(note: Command, ctx: CliContext): void {
  note
    .command("create")
    .description("Ingest a note into the Edges knowledge repo")
    .option("--title <title>", "Note title (1–120 chars)")
    .addOption(
      new Option("--content <content>", "Note body (1–50,000 chars)").conflicts(
        "contentFile",
      ),
    )
    .addOption(
      new Option(
        "--content-file <path>",
        "Read UTF-8 Markdown from a file",
      ).conflicts("content"),
    )
    .option(
      "--markdown",
      "Preserve authored Markdown without adding a title or template",
    )
    .addOption(
      new Option(
        "--import-entry <path>",
        "Validate and import the complete entry directory",
      ).conflicts(["content", "contentFile", "markdown"]),
    )
    .option(
      "--co-author <name-email>",
      'Git co-author, e.g. "Name <email@domain>" (3–200 chars)',
    )
    .option(
      "--json",
      "Write a machine-parseable JSON result to stdout (always on; flag kept for agents)",
    )
    .option(
      "--dry-run",
      "Set EDGES_DRY_RUN=true: write and commit locally, do not push",
    )
    .addOption(
      new Option(
        "--mode <mode>",
        "direct | pr  (default: EDGES_MODE or direct)",
      ).choices(["pr", "direct"]),
    )
    .addOption(
      new Option(
        "--token-file <path>",
        "Present EDGES_AUTH_TOKEN from a file (never pass the token on argv)",
      ),
    )
    .addOption(
      new Option(
        "--token-stdin",
        "Present EDGES_AUTH_TOKEN from a non-TTY stdin",
      ).conflicts("tokenFile"),
    )
    .action(async (opts: IngestCliOptions) => {
      if (opts.importEntry) {
        try {
          opts.content = new TextDecoder("utf-8", { fatal: true }).decode(
            await readFile(opts.importEntry),
          );
        } catch (error) {
          ctx.result = usageError(
            `Cannot read --import-entry: ${String(error)}`,
            "notes",
          );
          return;
        }
      }
      if (opts.contentFile) {
        try {
          opts.content = new TextDecoder("utf-8", { fatal: true }).decode(
            await readFile(opts.contentFile),
          );
        } catch (error) {
          ctx.result = usageError(
            `Cannot read --content-file: ${String(error)}`,
            "notes",
          );
          return;
        }
      }
      const parsed = validateNoteOptions(opts);
      if ("exitCode" in parsed) {
        ctx.result = parsed;
        return;
      }

      let request;
      try {
        request = validateInput({
          title: parsed.title,
          content: parsed.content,
          coAuthor: parsed.coAuthor,
        });
      } catch (error) {
        if (error instanceof ZodError) {
          ctx.result = usageError(formatZodReason(error), "notes");
          return;
        }
        throw error;
      }

      const env = ctx.env;
      const config = loadConfig(env);
      if (parsed.dryRun) {
        config.dryRun = true;
      }
      if (parsed.mode) {
        config.mode = parsed.mode;
      }

      const auth = await checkAuth({
        expectedToken: config.authToken,
        tokenFile: parsed.tokenFile,
        tokenStdin: parsed.tokenStdin,
        stdinText: ctx.stdinText,
        stdinIsTTY: ctx.stdinIsTTY,
      });
      if (!auth.ok) {
        ctx.result = fail({
          status: "failed",
          errorCode: auth.failure.errorCode,
          reason: auth.failure.reason,
        });
        return;
      }

      const result = await runIngest(
        { ...request, indexGroup: opts.indexGroup, markdown: opts.markdown, importEntry: opts.importEntry },
        config,
        runNoteIngest,
        env,
      );
      const stderrLines =
        result.status === "success" ? result.diagnostics : result.stderrSummary;
      const stderr = stderrLines
        ? stderrLines.endsWith("\n")
          ? stderrLines
          : `${stderrLines}\n`
        : "";
      ctx.result = {
        exitCode: result.status === "success" ? 0 : exitCodeForErrorCode(result.errorCode),
        stdout: formatResult(result),
        stderr,
      };
    });
}
