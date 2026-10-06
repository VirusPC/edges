import { Command } from 'commander';
import type { CliContext } from '../../../context.js';
import { resolveScope } from '../../../services/scope.js';
import { fail, succeed } from '../../result.js';

export type TargetOptions = { targetDir?: string };

export function target(options: TargetOptions, ctx: CliContext): string {
  return options.targetDir ? options.targetDir : resolveScope(ctx.env);
}

export function operation(ctx: CliContext, execute: () => unknown | Promise<unknown>): Promise<void> {
  return Promise.resolve().then(execute).then(result => {
    ctx.result = { exitCode: 0, stdout: JSON.stringify({ ok: true, ...result as object }, null, 2) + '\n', stderr: '' };
  }).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    ctx.result = { exitCode: 1, stdout: JSON.stringify({ ok: false, error: message }) + '\n', stderr: '' };
  });
}

export function scoped(command: Command): Command {
  return command.option('--target-dir <directory>', 'Explicit target scope (otherwise use --scope or scope discovery)');
}

const HINT = "See edges memory --help for usage.\n";

export function present(ctx: CliContext, run: () => Promise<Record<string, unknown>>): Promise<void> {
  return run()
    .then((payload) => {
      ctx.result = succeed(payload);
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      ctx.result = fail(message.includes("not found") ? "VALIDATION_ERROR" : "UNKNOWN_ERROR", message, HINT);
    });
}
