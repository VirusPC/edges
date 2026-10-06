import { Command } from "commander";
import type { CliContext } from "../context.js";
import { usageError } from "../context.js";
import { fail } from "./result.js";

function hint(ctx: CliContext, verb: "create" | "update"): void {
  ctx.result = fail(
    "VALIDATION_ERROR",
    `edges skill ${verb} does not write a SKILL.md. Run: edges memory remember`,
    "See edges skill --help for usage.\n",
  );
}

export function addSkillCommand(program: Command, ctx: CliContext): void {
  const skill = program
    .command("skill")
    .description("Point skill writes at memory remember. Does not write SKILL.md");
  skill.action(() => {
    ctx.result = usageError("missing skill command. Use edges skill --help.", "root");
  });
  skill
    .command("create")
    .description("Point at memory remember. Does not write a SKILL.md")
    .action(() => hint(ctx, "create"));
  skill
    .command("update")
    .description("Point at memory remember. Does not write a SKILL.md")
    .action(() => hint(ctx, "update"));
}
