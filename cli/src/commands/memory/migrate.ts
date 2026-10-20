import { Command } from 'commander';
import type { CliContext } from '../../context.js';
import { operation, scoped, target, type TargetOptions } from './utils/command.js';

export function addMemoryMigrateCommand(memory: Command, ctx: CliContext): void {
  scoped(memory.command('migrate').description('Explicitly migrate legacy .memory scopes to .harness'))
    .option('--root-dir <directory>', 'Boundary for the memory tree')
    .option('--recursive', 'Include actual descendant scopes')
    .option('--dry-run', 'Report the migration without changing files')
    .action((options: TargetOptions & { rootDir?: string; recursive?: boolean; dryRun?: boolean }) =>
      operation(ctx, async () => {
        const { migrateMemory } = await import('../../services/memory/service.js');
        return migrateMemory({ ...options, targetDir: target(options, ctx) });
      }));
}
