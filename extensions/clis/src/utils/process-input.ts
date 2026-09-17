export type ProcessInput = {
  argv: string[];
  stdinText?: string;
  stdinIsTTY: boolean;
};

function wantsStdin(argv: readonly string[]): boolean {
  if (argv.includes("--token-stdin")) {
    return true;
  }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--from=-") {
      return true;
    }
    if (arg === "--from" && argv[i + 1] === "-") {
      return true;
    }
  }
  return false;
}

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
 * Stdin can be consumed once. `--token-stdin` and `--from -` are scanned on
 * raw argv so we drain here (before Commander) and never put secrets on argv.
 * Skip TTY so an interactive terminal does not hang waiting for a pipe.
 */
export async function readProcessInput(
  argv: readonly string[],
  io: { stdin: NodeJS.ReadableStream; isTTY: boolean },
): Promise<ProcessInput> {
  const commandArgv = argv.slice(2);
  const stdinIsTTY = io.isTTY;
  const stdinText = wantsStdin(commandArgv) && !stdinIsTTY ? await readStdin(io.stdin) : undefined;
  return { argv: commandArgv, stdinText, stdinIsTTY };
}
