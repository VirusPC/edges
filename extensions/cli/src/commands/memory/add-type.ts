import { Command, Option } from 'commander';
import type { CliContext } from '../../context.js';
import { addMemoryType } from '../../services/memory/index.js';
import { operation, scoped, target, type TargetOptions } from './utils/command.js';
export function addMemoryAddTypeCommand(memory: Command, ctx: CliContext): void {
    scoped(memory.command('add-type').description('Register a custom type without changing existing permissions'))
        .requiredOption('--name <name>', 'Custom type name in snake_case')
        .requiredOption('--description <text>', 'Description of the type')
        .addOption(new Option('--module <module>', 'Harness module').choices(['memory', 'skills']).default('memory'))
        .option('--gitignore', 'Keep this type and its index private')
        .option('--index-only', 'Disallow entry writes')
        .option('--skills-format', 'Use <name>/SKILL.md entries')
        .option('--external-content-dir <directory>', 'Reserved; unsupported external mappings are rejected')
        .action((options: TargetOptions & {
        name: string;
        description: string;
        module?: 'memory' | 'skills';
        gitignore?: boolean;
        indexOnly?: boolean;
        skillsFormat?: boolean;
        externalContentDir?: string;
    }) => operation(ctx, async () => await addMemoryType({ ...options, targetDir: target(options, ctx) })));
}
