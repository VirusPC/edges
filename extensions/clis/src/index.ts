#!/usr/bin/env node
/**
 * Bin for `edges` (`#!/usr/bin/env node` + stdin/stdout). This is not a barrel.
 * Nested `index.ts` files re-export that directory's program + run.
 * Argv parsing lives in `program.ts`. `run.ts` (a file, not a folder) dispatches.
 */
import { readProcessInput } from "./utils/process-input.js";
import { run } from "./run.js";

const input = await readProcessInput(process.argv, {
  stdin: process.stdin,
  isTTY: Boolean(process.stdin.isTTY),
});

const result = await run(input.argv, {
  env: process.env,
  stdinText: input.stdinText,
  stdinIsTTY: input.stdinIsTTY,
});

// JSON (or table) on stdout; diagnostics on stderr. Agents parse stdout.
if (result.stdout) {
  process.stdout.write(result.stdout);
}
if (result.stderr) {
  process.stderr.write(result.stderr);
}
process.exit(result.exitCode);
