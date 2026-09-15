import { Command, CommanderError } from "commander";
import {
  type CliContext,
  type RunIo,
  type RunResult,
  usageError,
  usageScope,
} from "./context.js";
import { addNoteCommand } from "./note.js";
import { addTasksCommand } from "./tasks.js";
import { VERSION } from "./utils/version.js";

export type { CliContext, RunIo, RunResult };

const ROOT_AFTER_HELP = `
EXAMPLES
  edges note --title "Daily" --content "Notes from the session." --co-author "Codex <codex@openai.com>" --json
  edges note --help
  edges tasks --help

BREAKING RENAME
  The bin is edges only (not edges-note). There is no shim.
  Callers must migrate to: edges note --title … --content … --co-author …
`;

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

function addRootCommand(ctx: CliContext, output?: {
  writeOut: (str: string) => void;
  writeErr: (str: string) => void;
}): Command {
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
    ctx.result = usageError("missing command. Use edges --help.", "root");
  });

  addNoteCommand(program, ctx);
  addTasksCommand(program, ctx);
  program.addHelpText("after", ROOT_AFTER_HELP);
  applyOutput(program, output);
  return program;
}

function helpText(text: string): string {
  if (text.trim().length === 0) {
    return formatHelp();
  }
  return text.endsWith("\n") ? text : `${text}\n`;
}

export function formatHelp(): string {
  let out = "";
  const program = addRootCommand(
    { io: {}, result: undefined },
    {
      writeOut: (str) => {
        out += str;
      },
      writeErr: (str) => {
        out += str;
      },
    },
  );
  program.outputHelp();
  return out.endsWith("\n") ? out : `${out}\n`;
}

/**
 * Root-only: invoke the command tree as a process. Leaves and groups do not
 * have a sibling `run.ts`; they register on a parent and execute in `.action`.
 */
export async function run(argv: string[], io: RunIo = {}): Promise<RunResult> {
  if (argv[0] === "ingest") {
    return usageError("ingest was renamed to note. Use: edges note …", "root");
  }

  const ctx: CliContext = { io: { ...io, env: io.env ?? process.env }, result: undefined };
  let output = "";
  const program = addRootCommand(ctx, {
    writeOut: (str) => {
      output += str;
    },
    writeErr: (str) => {
      output += str;
    },
  });
  applyExitOverride(program);

  try {
    await program.parseAsync(argv, { from: "user" });
  } catch (err) {
    if (err instanceof CommanderError) {
      if (err.code === "commander.helpDisplayed" || err.code === "commander.help") {
        return { exitCode: 0, stdout: helpText(output), stderr: "" };
      }
      if (err.code === "commander.version") {
        return { exitCode: 0, stdout: `${VERSION}\n`, stderr: "" };
      }
      const reason = err.message.replace(/^error:\s*/i, "");
      return usageError(reason, usageScope(argv));
    }
    const message = err instanceof Error ? err.message : String(err);
    return usageError(message, usageScope(argv));
  }

  return ctx.result ?? usageError("missing command. Use edges --help.", usageScope(argv));
}
