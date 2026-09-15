/**
 * One `edges` process invocation.
 *
 * `CliContext` is the production snapshot plus Commander's out-slot. It is not
 * a Task Run (`edges tasks runs`), and it does not carry test doubles
 * (`ingest`, `fs`, `writer`, `now`). Tests override production env vars
 * (e.g. `EDGES_REPO`) or call domain functions directly.
 */

/** Process output: JSON/table on stdout, diagnostics on stderr. */
export type CliResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

/** Production input to `run()`. Omit to default `env` to `process.env`. */
export type CliInput = {
  env?: NodeJS.ProcessEnv;
  stdinText?: string;
  stdinIsTTY?: boolean;
};

export type CliContext = {
  env: NodeJS.ProcessEnv;
  stdinText?: string;
  stdinIsTTY?: boolean;
  result: CliResult | undefined;
};

export function usageError(reason: string, scope: "root" | "note" | "tasks"): CliResult {
  const usage =
    scope === "note"
      ? "See edges note --help for usage.\n"
      : scope === "tasks"
        ? "See edges tasks --help for usage.\n"
        : "See edges --help for usage.\n";
  return {
    exitCode: 2,
    stdout: `${JSON.stringify({ status: "failed", errorCode: "VALIDATION_ERROR", reason })}\n`,
    stderr: usage,
  };
}

export function usageScope(argv: string[]): "root" | "note" | "tasks" {
  if (argv[0] === "note") return "note";
  if (argv[0] === "tasks") return "tasks";
  return "root";
}
