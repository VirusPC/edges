export type ProcessInput = {
  argv: string[];
  stdinText?: string;
  stdinIsTTY: boolean;
};

async function readStdin(stdin: NodeJS.ReadableStream): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

/**
 * Turn `process.argv` + stdin into what `run()` needs.
 *
 * Stdin can be consumed once. `--token-stdin` is scanned on raw argv so we
 * drain it here (before Commander) and never put the token on argv. Skip TTY
 * so an interactive terminal does not hang waiting for a token.
 */
export async function readProcessInput(
  argv: readonly string[],
  io: { stdin: NodeJS.ReadableStream; isTTY: boolean },
): Promise<ProcessInput> {
  const commandArgv = argv.slice(2);
  const stdinIsTTY = io.isTTY;
  const stdinText =
    commandArgv.includes("--token-stdin") && !stdinIsTTY ? await readStdin(io.stdin) : undefined;
  return { argv: commandArgv, stdinText, stdinIsTTY };
}
