import { Command } from 'commander';
import type { CliContext } from '../../context.js';
import { restoreUserMemory } from '../../services/memory/archive.js';
import { operation } from './utils/command.js';
import { resolveScope } from '../../services/scope.js';

export function addMemoryRestoreCommand(memory: Command, ctx: CliContext): void {
  memory.command('restore').description('Restore a validated user-memory archive')
    .requiredOption('--archive <path>', 'New-layout user-memory archive')
    .option('--repo-dir <directory>', 'Target scope (otherwise use --scope)')
    .option('--force', 'Replace occupied user memory; requires explicit user authorization')
    .action((options: { archive: string; repoDir?: string; force?: boolean }) =>
      operation(ctx, () => restoreUserMemory({ ...options, repoDir: options.repoDir ?? resolveScope(ctx.env) })));
}
