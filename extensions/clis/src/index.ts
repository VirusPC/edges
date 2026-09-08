#!/usr/bin/env node
import { run } from "./run.js";

async function readStdin(stdin: NodeJS.ReadableStream): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

const wantsStdinToken = process.argv.includes("--token-stdin");
const stdinText = wantsStdinToken && !process.stdin.isTTY ? await readStdin(process.stdin) : undefined;

const result = await run(process.argv.slice(2), {
  env: process.env,
  stdinText,
  stdinIsTTY: Boolean(process.stdin.isTTY),
});

if (result.stdout) {
  process.stdout.write(result.stdout);
}
if (result.stderr) {
  process.stderr.write(result.stderr);
}
process.exit(result.exitCode);
