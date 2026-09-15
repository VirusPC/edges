import { Command, CommanderError } from "commander";
import { ROOT_AFTER_HELP } from "./help.js";
import {
  addNoteCommand,
  type IngestCliOptions,
  type NoteParseOk,
} from "./note/index.js";
import { TASKS_AFTER_HELP } from "./tasks/help.js";
import { addTasksCommands } from "./tasks/index.js";
import type { TasksParseOk } from "./tasks/utils/types.js";
import type { IngestErrorCode } from "./note/utils/types.js";
import { VERSION } from "./utils/version.js";

export type { IngestCliOptions, NoteParseOk };

export type ProgramHandlers = {
  onNote?: (opts: IngestCliOptions) => void;
  onTasksCommand?: (parsed: TasksParseOk) => void;
  onMissingTasksCommand?: () => void;
  onMissingCommand?: () => void;
};

export type ParseOk =
  | { kind: "help"; text: string }
  | { kind: "version" }
  | NoteParseOk
  | TasksParseOk;

export type ParseFail = {
  kind: "error";
  errorCode: IngestErrorCode;
  reason: string;
};

export type ParseResult = ParseOk | ParseFail;

function applyOutput(
  cmd: Command,
  output?: { writeOut: (str: string) => void; writeErr: (str: string) => void },
): void {
  if (!output) {
    return;
  }
  cmd.configureOutput(output);
  for (const child of cmd.commands) {
    applyOutput(child, output);
  }
}

function applyExitOverride(cmd: Command): void {
  cmd.exitOverride();
  for (const child of cmd.commands) {
    applyExitOverride(child);
  }
}

export function createProgram(
  handlers: ProgramHandlers = {},
  output?: { writeOut: (str: string) => void; writeErr: (str: string) => void },
): Command {
  const program = new Command();
  program
    .name("edges")
    .description("Edges CLI: notes, tasks, and more")
    .version(VERSION, "-v, --version", "Print version")
    .helpOption("-h, --help", "Show this help")
    .allowExcessArguments(false)
    .showHelpAfterError(false)
    .showSuggestionAfterError(false)
    .helpCommand(false);

  program.action(() => {
    handlers.onMissingCommand?.();
  });

  addNoteCommand(program, handlers.onNote);

  const tasks = program
    .command("tasks")
    .description("Task board commands")
    .allowExcessArguments(false)
    .showHelpAfterError(false)
    .helpOption("-h, --help", "Show this help");

  addTasksCommands(tasks, (parsed) => {
    handlers.onTasksCommand?.(parsed);
  });
  tasks.action(() => {
    handlers.onMissingTasksCommand?.();
  });
  tasks.addHelpText("after", TASKS_AFTER_HELP);

  program.addHelpText("after", ROOT_AFTER_HELP);
  applyOutput(program, output);
  return program;
}

export function formatHelp(): string {
  let out = "";
  const program = createProgram(undefined, {
    writeOut: (str) => {
      out += str;
    },
    writeErr: (str) => {
      out += str;
    },
  });
  program.outputHelp();
  return out.endsWith("\n") ? out : `${out}\n`;
}

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
  let collectedTasks: TasksParseOk | undefined;
  let sawMissingTasksCommand = false;
  let sawMissingCommand = false;
  let output = "";
  const program = createProgram(
    {
      onNote: (opts) => {
        collected = opts;
      },
      onTasksCommand: (parsed) => {
        collectedTasks = parsed;
      },
      onMissingTasksCommand: () => {
        sawMissingTasksCommand = true;
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

  if (sawMissingTasksCommand) {
    return validationError("missing tasks subcommand. Use edges tasks --help.");
  }
  if (collectedTasks) {
    return collectedTasks;
  }
  if (sawMissingCommand) {
    return validationError("missing command. Use edges --help.");
  }
  if (!collected) {
    return validationError("missing command. Use edges --help.");
  }

  return fromNoteOptions(collected);
}
