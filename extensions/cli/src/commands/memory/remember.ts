import { Command, Option } from "commander";
import type { CliContext } from "../../context.js";
import { rememberMemory } from "../../services/memory/index.js";
import {
  operation,
  scoped,
  target,
  type TargetOptions,
} from "./utils/command.js";
import { readFile } from "node:fs/promises";
export function addMemoryRememberCommand(
  memory: Command,
  ctx: CliContext,
): void {
  scoped(
    memory
      .command("remember")
      .description(
        "Write an adopted memory or managed skill and refresh its index",
      ),
  )
    .requiredOption("--type <type>", "An adopted writable type")
    .requiredOption(
      "--slug <slug>",
      "Entry identifier (snake_case, or kebab-case for Skill format)",
    )
    .addOption(
      new Option(
        "--import-entry <path>",
        "Validate and import the complete entry directory",
      ).conflicts(["content", "contentFile", "markdown"]),
    )
    .option("--title <title>", "Entry title")
    .option(
      "--description <text>",
      "Index description; required for new entries",
    )
    .addOption(
      new Option("--content <markdown>", "Markdown body").conflicts(
        "contentFile",
      ),
    )
    .addOption(
      new Option(
        "--content-file <path>",
        "Read Markdown body from a UTF-8 file",
      ).conflicts("content"),
    )
    .option("--origin-session-id <id>", "Origin session identifier")
    .option("--agent-client <name>", "Agent client name")
    .option("--username <name>", "Author name (defaults to Git identity)")
    .option("--email <email>", "Author email (defaults to Git identity)")
    .action(
      (
        options: TargetOptions & {
          type: string;
          slug: string;
          importEntry?: string;
          title?: string;
          description?: string;
          content?: string;
          contentFile?: string;
          originSessionId?: string;
          agentClient?: string;
          username?: string;
          email?: string;
        },
      ) =>
        operation(ctx, async () => {
          const { contentFile, ...rest } = options;
          if (
            rest.content === undefined &&
            contentFile === undefined &&
            !rest.importEntry
          )
            throw new Error(
              "Provide --content, --content-file or --import-entry.",
            );
          const content =
            contentFile === undefined
              ? rest.content!
              : new TextDecoder("utf-8", { fatal: true }).decode(
                  await readFile(contentFile),
                );
          return await rememberMemory({
            ...rest,
            targetDir: target(options, ctx),
            content,
            env: ctx.env,
          });
        }),
    );
}
