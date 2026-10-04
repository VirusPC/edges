import { Command } from 'commander';
import type { CliContext } from '../context.js';
import { doctorMemory } from '../services/memory/index.js';
import { operation, scoped, target, type TargetOptions } from './utils/command.js';

export function addMemoryDoctorCommand(memory: Command, ctx: CliContext): void {
  scoped(memory.command('doctor').description('Diagnose indexes; only --apply writes repairs'))
    .option('--root-dir <directory>', 'Boundary for the memory tree')
    .option('--apply', 'Apply supported repairs')
    .action((options: TargetOptions & { rootDir?: string; apply?: boolean }) =>
      operation(ctx, () => doctorMemory({ ...options, targetDir: target(options, ctx) })));
}
