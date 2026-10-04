import { Command } from 'commander';
import { type CliContext, usageError } from './context.js';
import { addMemoryInitCommand } from './memory/init.js';
import { addMemoryRememberCommand } from './memory/remember.js';
import { addMemoryAddTypeCommand } from './memory/add-type.js';
import { addMemoryDoctorCommand } from './memory/doctor.js';
import { addMemoryBackupCommand } from './memory/backup.js';
import { addMemoryRestoreCommand } from './memory/restore.js';

export function addMemoryCommand(program: Command, ctx: CliContext): void {
  const memory = program.command('memory').description('Project memory, indexes, and explicit layout migration');
  memory.action(() => { ctx.result = usageError('missing memory command. Use edges memory --help.', 'memory'); });
  addMemoryInitCommand(memory, ctx);
  addMemoryRememberCommand(memory, ctx);
  addMemoryAddTypeCommand(memory, ctx);
  addMemoryDoctorCommand(memory, ctx);
  addMemoryBackupCommand(memory, ctx);
  addMemoryRestoreCommand(memory, ctx);
}
