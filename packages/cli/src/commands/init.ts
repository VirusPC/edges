import { Command } from "commander";
import type { CliContext } from "../context.js";
import { initScope } from "../services/init/service.js";
import { fail, succeed } from "./result.js";

const HELP = "See edges init --help for usage.\n";

/** Warn only when the resolved module set omits skills. `skillsInstall: false` also covers an early stop, such as memory type selection. */
export function ignoredInstallTokens(
  modules: readonly string[] | undefined,
  args: readonly string[] | undefined,
): string {
  if (!args?.length || modules === undefined || modules.includes("skills")) return "";
  return `warning: skills was not selected; ignoring install tokens: ${args.join(" ")}\n`;
}

const AFTER_HELP = `
Without --super, materials land under <scope>/.edges. --super uses <scope>/<module>/ and adds one constraints line. Selected --project still wins for the material root.
Project initialization registers materials on INDEX.md without creating AGENTS.md.
Tokens after -- are forwarded only to the bundled skills install step.
  edges init -- -y --agent '*'

CREATED WHEN NO MODULE IS GIVEN
  AGENTS.md
  memory types: feedback, project, reference
  skills: managed and referenced type indexes, then install bundled skills
  harness index entries: tasks, notes, projects
  tasks board: <scope>/.edges/tasks/README.md (--super: <scope>/tasks/README.md)
  notes/projects org lists: <scope>/.edges/notes/README.md, <scope>/.edges/projects/README.md
    (--super: <scope>/notes/README.md, <scope>/projects/README.md)

NOT CREATED HERE
  routines (not in the default set; edges routines init creates only that module)
  user memory, evaluation, and observation
`;

export function addInitCommand(program: Command, ctx: CliContext): void {
  program
    .command("init")
    .description(
      "Initialize AGENTS.md and selected modules. --super writes the scope-root material face.",
    )
    .argument("[module...]", "Repeatable module: memory, skills, tasks, notes, projects, or routines")
    .option("--target-dir <directory>", "Explicit target scope (otherwise use --scope or scope discovery)")
    .option("--root-dir <directory>", "Boundary for the scope tree")
    .option("--description <text>", "Description in the parent scope index")
    .option("--memory-types <types...>", "Select memory types: project feedback reference user")
    .option("--skill-types <types...>", "Select skill types: managed referenced")
    .allowExcessArguments(false)
    .addHelpText("after", AFTER_HELP)
    .action(
      async (
        modules: string[],
        options: {
          targetDir?: string;
          rootDir?: string;
          description?: string;
          memoryTypes?: string[];
          skillTypes?: string[];
        },
      ) => {
        try {
          const result = await initScope({
            ...options,
            modules,
            skillsInstallArgs: ctx.skillsInstallArgs,
            env: ctx.env,
            project: ctx.project,
            super: ctx.super === true,
          });
          const skillsInstall = result.skillsInstall === true;
          const { skillsInstall: _install, ...payload } = result;
          if (skillsInstall && "created" in payload) {
            ctx.pendingSkillsInstall = {
              args: ctx.skillsInstallArgs ?? [],
              created: payload.created,
              stderrHint: HELP,
            };
          }
          ctx.result = succeed(
            { ...payload, command: "init" },
            ignoredInstallTokens(result.modules, ctx.skillsInstallArgs),
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          ctx.result = fail("VALIDATION_ERROR", message, HELP);
        }
      },
    );
}
