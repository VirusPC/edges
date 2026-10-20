import { Command } from 'commander';
import type { CliContext } from '../../context.js';
import { backupUserMemory, resolveScope } from '../../services/memory/service.js';
import { operation } from './utils/command.js';

export function addMemoryBackupCommand(memory: Command, ctx: CliContext): void {
  memory.command('backup').description('Archive private user memory with its index and assets')
    .option('--repo-dir <directory>', 'Scope containing user memory (otherwise use --scope)')
    .option('--output-dir <directory>', 'Archive directory (defaults to the scope)')
    .option('--timestamp <stamp>', 'Explicit archive filename timestamp')
    .action((options: { repoDir?: string; outputDir?: string; timestamp?: string }) =>
      operation(ctx, () => backupUserMemory({ ...options, repoDir: options.repoDir ?? resolveScope(ctx.env) })));
}
