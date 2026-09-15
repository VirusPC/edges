import { Command, CommanderError } from "commander";
import {
  type CliContext,
  type CliInput,
  type CliResult,
  usageError,
  usageScope,
} from "./context.js";
import { addNoteCommand } from "./note.js";
import { addTasksCommand } from "./tasks.js";
import { VERSION } from "./utils/version.js";

export type { CliContext, CliInput, CliResult };

const ROOT_AFTER_HELP = `
EXAMPLES
  edges note --title "Daily" --content "Notes from the session." --co-author "Codex <codex@openai.com>" --json
  edges note --help
  edges tasks --help

BREAKING RENAME
  The bin is edges only (not edges-note). There is no shim.
  Callers must migrate to: edges note --title … --content … --co-author …
`;

/**
 * Capture Commander `--help` text. This is not process IO and not CliContext;
 * leaves never call it.
 */
function captureCommanderText() {
  let text = "";
  const write = (str: string) => {
    text += str;
  };
  return {
    configure: { writeOut: write, writeErr: write },
    text: () => text,
  };
}

type CommanderTextConfigure = ReturnType<typeof captureCommanderText>["configure"];

function applyOutput(cmd: Command, output: CommanderTextConfigure): void {
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

function addRootCommand(ctx: CliContext, output: CommanderTextConfigure): Command {
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
  const capture = captureCommanderText();
  const program = addRootCommand({ env: process.env, result: undefined }, capture.configure);
  program.outputHelp();
  const text = capture.text();
  return text.endsWith("\n") ? text : `${text}\n`;
}

/**
 * Root-only: invoke the command tree as a process. Leaves and groups do not
 * have a sibling `run.ts`; they register on a parent and execute in `.action`.
 */
export async function run(argv: string[], input: CliInput = {}): Promise<CliResult> {
  if (argv[0] === "ingest") {
    return usageError("ingest was renamed to note. Use: edges note …", "root");
  }

  const ctx: CliContext = {
    env: input.env ?? process.env,
    stdinText: input.stdinText,
    stdinIsTTY: input.stdinIsTTY,
    result: undefined,
  };
  const capture = captureCommanderText();
  const program = addRootCommand(ctx, capture.configure);
  applyExitOverride(program);

  try {
    await program.parseAsync(argv, { from: "user" });
  } catch (err) {
    if (err instanceof CommanderError) {
      if (err.code === "commander.helpDisplayed" || err.code === "commander.help") {
        return { exitCode: 0, stdout: helpText(capture.text()), stderr: "" };
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
