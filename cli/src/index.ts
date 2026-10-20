#!/usr/bin/env node
/**
 * Bin for `edges`. Root-only process I/O. Command nodes are `program.ts`
 * (root), `note.ts` / `tasks.ts` (children), and `tasks/get.ts` (leaves).
 */
import { readProcessInput } from "./utils/process-input.js";
import { run } from "./program.js";

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
