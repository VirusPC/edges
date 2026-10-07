import path from "node:path";
import { expandHomePath } from "./utils/filesystem.js";
import { Command, CommanderError } from "commander";
import {
  type CliContext,
  type CliInput,
  type CliResult,
  usageError,
  usageScope,
} from "./context.js";
import { addSchemaCommand } from "./commands/schema.js";
import { addArtifactsCommand } from "./commands/artifacts.js";
import { addNoteCommand } from "./commands/note.js";
import { addTasksCommand } from "./commands/tasks.js";
import { addMemoryCommand } from "./commands/memory.js";
import { addSkillCommand } from "./commands/skill.js";
import { addForestCommand } from "./commands/forest.js";
import { acquireWriteLock } from "./services/node/node-lock.js";
import { VERSION } from "./utils/version.js";

export type { CliContext, CliInput, CliResult };

const ROOT_AFTER_HELP = `
EXAMPLES
  edges --scope ./projects/demo tasks --purpose maintenance list
  edges --scope . forest list
  edges --scope . forest list --form innermost --no-super
  edges note create --title "Daily" --content "Notes from the session." --co-author "Codex <codex@openai.com>" --json
  edges note --help
  edges tasks --help
  edges artifacts --help
  edges --scope ./projects/demo memory init --memory-types project feedback
  edges memory --help

BREAKING RENAME
  The bin is edges only (not edges-note). There is no shim.
  Callers must migrate to: edges note create --title … --content … --co-author …
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

type CommanderTextConfigure = ReturnType<
  typeof captureCommanderText
>["configure"];

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

function addRootCommand(
  ctx: CliContext,
  output: CommanderTextConfigure,
  beforeWrite?: (target: string) => Promise<void>,
): Command {
  const program = new Command();
  program
    .name("edges")
    .option(
      "--scope <directory>",
      "Target content scope (default: EDGES_SCOPE, EDGES_REPO, or cwd owner)",
    )
    .option(
      "--super",
      "Root at a runtime SuperAgentsNode mounting harness-materials README paths (never written to disk)",
    )
    .description("Edges CLI: notes, tasks, artifacts, and more")
    .version(VERSION, "-v, --version", "Print version")
    .helpOption("-h, --help", "Show this help")
    .allowExcessArguments(false)
    .showHelpAfterError(false)
    .showSuggestionAfterError(false)
    .helpCommand(false);

  program.hook("preAction", async (_program, command) => {
    const { scope, super: useSuper } = program.opts<{ scope?: string; super?: boolean }>();
    if (useSuper) ctx.super = true;
    if (scope !== undefined) ctx.env = { ...ctx.env, EDGES_SCOPE: scope };
    const target = commandWriteTarget(command, ctx.env);
    if (target !== undefined) await beforeWrite?.(target);
  });

  program.action(() => {
    ctx.result = usageError("missing command. Use edges --help.", "root");
  });

  addNoteCommand(program, ctx);
  addTasksCommand(program, ctx);
  addMemoryCommand(program, ctx);
  addSkillCommand(program, ctx);
  addArtifactsCommand(program, ctx);
  addSchemaCommand(program, ctx);
  addForestCommand(program, ctx);
  program.addHelpText("after", ROOT_AFTER_HELP);
  applyOutput(program, output);
  return program;
}

/** Inventory of content mutations. init may also write ancestors up to rootDir.
 * Normalize each option as its action does, without reading business documents. */
function commandWriteTarget(
  command: Command,
  env: NodeJS.ProcessEnv,
): string | undefined {
  const name = command.name(),
    parent = command.parent?.name();
  const options = command.opts();
  const writes =
    (parent === "note" && ["create", "update", "delete"].includes(name)) ||
    (parent === "tasks" && ["create", "update", "status"].includes(name)) ||
    (parent === "project" &&
      command.parent?.parent?.name() === "tasks" &&
      ["create", "update"].includes(name)) ||
    (parent === "memory" &&
      (["init", "add-type", "remember", "restore", "delete"].includes(name) ||
        (name === "doctor" && options.apply) ||
        (name === "migrate" && !options.dryRun)));
  if (!writes) return undefined;
  if (parent === "memory" && options.targetDir)
    return path.resolve(expandHomePath(options.targetDir));
  if (
    parent === "memory" &&
    name === "restore" &&
    options.repoDir !== undefined
  )
    return path.resolve(expandHomePath(options.repoDir, true));
  // Scope/environment values are literal paths, including a quoted tilde.
  return path.resolve(
    env.EDGES_SCOPE?.trim() || env.EDGES_REPO?.trim() || process.cwd(),
  );
}

function helpText(text: string): string {
  if (text.trim().length === 0) {
    return formatHelp();
  }
  return text.endsWith("\n") ? text : `${text}\n`;
}

export function formatHelp(): string {
  const capture = captureCommanderText();
  const program = addRootCommand(
    { env: process.env, result: undefined },
    capture.configure,
  );
  program.outputHelp();
  const text = capture.text();
  return text.endsWith("\n") ? text : `${text}\n`;
}

/**
 * Root-only: invoke the command tree as a process. Leaves and groups do not
 * have a sibling `run.ts`; they register on a parent and execute in `.action`.
 */
export async function run(
  argv: string[],
  input: CliInput = {},
): Promise<CliResult> {
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
  let release: (() => Promise<void>) | undefined;
  const program = addRootCommand(ctx, capture.configure, async (target) => {
    release = await acquireWriteLock(target);
  });
  applyExitOverride(program);

  try {
    await program.parseAsync(argv, { from: "user" });
  } catch (err) {
    if (err instanceof CommanderError) {
      if (
        err.code === "commander.helpDisplayed" ||
        err.code === "commander.help"
      ) {
        ctx.result = {
          exitCode: 0,
          stdout: helpText(capture.text()),
          stderr: "",
        };
      } else if (err.code === "commander.version") {
        ctx.result = { exitCode: 0, stdout: `${VERSION}\n`, stderr: "" };
      } else {
        ctx.result = usageError(
          err.message.replace(/^error:\s*/i, ""),
          usageScope(argv),
        );
      }
    } else {
      ctx.result = usageError(
        err instanceof Error ? err.message : String(err),
        usageScope(argv),
      );
    }
  } finally {
    try {
      await release?.();
    } catch (error) {
      const message = `Node write lock release failed: ${String(error)}`;
      if (ctx.result && ctx.result.exitCode !== 0) {
        // Preserve the original structured error and every recovery path verbatim.
        ctx.result = {
          ...ctx.result,
          stderr:
            ctx.result.stderr +
            (ctx.result.stderr && !ctx.result.stderr.endsWith("\n")
              ? "\n"
              : "") +
            message +
            "\n",
        };
      } else {
        const previousStderr = ctx.result?.stderr ?? "";
        ctx.result = usageError(message, usageScope(argv));
        ctx.result.stderr = previousStderr + ctx.result.stderr;
      }
    }
  }
  return (
    ctx.result ??
    usageError("missing command. Use edges --help.", usageScope(argv))
  );
}
