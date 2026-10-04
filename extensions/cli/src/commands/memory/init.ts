import { Command } from 'commander';
import type { CliContext } from '../../context.js';
import { initMemory } from '../../services/memory/index.js';
import { operation, scoped, target, type TargetOptions } from './utils/command.js';
export function addMemoryInitCommand(memory: Command, ctx: CliContext): void {
    scoped(memory.command('init').description('Initialize explicitly selected types, or refresh adopted types'))
        .option('--root-dir <directory>', 'Boundary for the memory tree')
        .option('--description <text>', 'Description in the parent scope index')
        .option('--memory-types <types...>', 'Select memory types: project feedback reference user')
        .option('--skill-types <types...>', 'Select skill types: managed referenced')
        .action((options: TargetOptions & {
        rootDir?: string;
        description?: string;
        memoryTypes?: string[];
        skillTypes?: string[];
    }) => operation(ctx, async () => await initMemory({ ...options, targetDir: target(options, ctx) })));
}
