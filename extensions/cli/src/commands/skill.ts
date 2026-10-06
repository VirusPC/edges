import { Command } from "commander";
import type { CliContext } from "../context.js";
import { usageError } from "../context.js";
import { fail } from "./result.js";
import { resolveScope } from "../services/scope.js";
import { deleteSkill, getSkill, listSkills } from "../services/skills/records.js";
import { succeed } from "./result.js";

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
  skill.command("list").description("List SKILL.md files under the scope").action(() => {
    try {
      ctx.result = succeed({ command: "skill.list", items: listSkills(resolveScope(ctx.env)) });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      ctx.result = fail("UNKNOWN_ERROR", message, "See edges skill --help for usage.\n");
    }
  });
  for (const verb of ["get", "delete"] as const) {
    skill
      .command(verb)
      .description(verb === "get" ? "Read one skill by path or name" : "Delete one skill directory")
      .argument("<target>", "SKILL.md path or skill name")
      .action((target: string) => {
        try {
          const record = verb === "get" ? getSkill(resolveScope(ctx.env), target) : deleteSkill(resolveScope(ctx.env), target);
          ctx.result = succeed({ command: `skill.${verb}`, ...record });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          ctx.result = fail(
            message.includes("not found") || message.includes("ambiguous") ? "VALIDATION_ERROR" : "UNKNOWN_ERROR",
            message,
            "See edges skill --help for usage.\n",
          );
        }
      });
  }
}
