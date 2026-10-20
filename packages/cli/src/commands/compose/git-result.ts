import type { CliResult } from "../../context.js";
import type { ComposeGitReport } from "../../services/compose/service.js";
import { exitCodeForErrorCode } from "../exit.js";
import { nodeErrorCode } from "../node-result.js";
import { failWithExit, succeed } from "../result.js";

export const COMPOSE_GIT_AFTER_HELP = `
Entries inside the owner's git repo (default .harness/compose/<name>) are git
submodules: clone runs "git submodule update --init -- <path>" (never
--recursive), pull runs "git submodule update --init --remote -- <path>", push
runs "git push" inside the submodule and fails on a detached HEAD. Legacy entries
outside the repo (~/... or absolute paths) keep plain git clone / pull / push and
print a migration warning.

Each entry is handled on its own. A failing entry (missing checkout, git error,
origin mismatch) is reported with action "failed" and its error, prints one
"warning: ..." line on stderr, and the remaining entries still run.
Exit 0 when at least one entry succeeds. Non-zero when every requested entry
failed (including --name on a failing entry), or on scope / unknown --name errors.
`;

/**
 * Result for compose clone / pull / push. Every entry is listed with its action.
 * Each failed entry adds one `warning:` line on stderr. Partial failure still
 * succeeds (exit 0); the command fails only when every requested entry failed,
 * which includes `--name` on a single entry that failed.
 */
export function composeGitResult(
  verb: "clone" | "pull" | "push",
  entries: ComposeGitReport[],
  help: string,
  notes: readonly string[] = [],
): CliResult {
  const command = `compose.${verb}`;
  const failed = entries.filter((entry) => entry.action === "failed");
  const warnings = failed
    .map((entry) => `warning: compose ${verb} failed for ${entry.name}: ${entry.error ?? "unknown error"}\n`)
    .join("");
  const stderr = notes.join("") + warnings;
  if (failed.length === 0 || failed.length < entries.length)
    return succeed({ command, entries }, stderr);
  const only = failed.length === 1 ? failed[0] : undefined;
  const reason = only?.error ?? `compose ${verb} failed for all ${failed.length} entries`;
  const errorCode = only ? nodeErrorCode(reason) : "UNKNOWN_ERROR";
  return failWithExit(exitCodeForErrorCode(errorCode), errorCode, reason, stderr + help, {
    command,
    entries,
  });
}
