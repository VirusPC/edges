import type { Command } from 'commander';
import { type CliContext, usageError } from '../context.js';
import { readSchemaArtifact, readSchemaManifest } from '../utils/schema-artifacts.js';

export function addSchemaCommand(program: Command, ctx: CliContext): void {
  const command = program.command('schema').description('Read packaged JSON Schema contracts');
  command.action(() => { ctx.result = usageError('missing schema command. Use edges schema --help.', 'schema'); });
  command.command('list').description('List available schema contracts').allowExcessArguments(false).action(() => {
    const entries = readSchemaManifest().map(({key, id, title, description}) => ({key, id, title, description}));
    ctx.result = {exitCode: 0, stdout: JSON.stringify(entries) + '\n', stderr: ''};
  });
  command.command('get').description('Print a complete JSON Schema').argument('<key>', 'Schema key, e.g. task-doc/v1').allowExcessArguments(false).action((key: string) => {
    ctx.result = {exitCode: 0, stdout: readSchemaArtifact(key), stderr: ''};
  });
}
