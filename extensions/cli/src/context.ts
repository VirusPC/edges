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
  purpose?: "domain" | "maintenance";
  result: CliResult | undefined;
};

export function usageError(reason: string, scope: "root" | "note" | "tasks" | "artifacts"): CliResult {
  const usage =
    scope === "note"
      ? "See edges note --help for usage.\n"
      : scope === "tasks"
        ? "See edges tasks --help for usage.\n"
        : scope === "artifacts"
          ? "See edges artifacts --help for usage.\n"
        : "See edges --help for usage.\n";
  return {
    exitCode: 2,
    stdout: `${JSON.stringify({ status: "failed", errorCode: "VALIDATION_ERROR", reason })}\n`,
    stderr: usage,
  };
}

export function usageScope(argv: string[]): "root" | "note" | "tasks" | "artifacts" {
  const command = argv.filter((arg, i) => arg !== "--scope" && argv[i - 1] !== "--scope" && !arg.startsWith("--scope="))[0];
  if (command === "note") return "note";
  if (command === "tasks") return "tasks";
  if (command === "artifacts") return "artifacts";
  return "root";
}
