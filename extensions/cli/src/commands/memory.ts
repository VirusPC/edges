import { Command } from 'commander';
import { type CliContext, usageError } from '../context.js';
import { addMemoryInitCommand } from './memory/init.js';
import { addMemoryRememberCommand } from './memory/remember.js';
import { addMemoryCreateCommand } from './memory/create.js';
import { addMemoryDeleteCommand } from './memory/delete.js';
import { addMemoryGetCommand } from './memory/get.js';
import { addMemoryListCommand } from './memory/list.js';
import { addMemoryUpdateCommand } from './memory/update.js';
import { addMemoryAddTypeCommand } from './memory/add-type.js';
import { addMemoryDoctorCommand } from './memory/doctor.js';
import { addMemoryBackupCommand } from './memory/backup.js';
import { addMemoryMigrateCommand } from './memory/migrate.js';
import { addMemoryRestoreCommand } from './memory/restore.js';

export function addMemoryCommand(program: Command, ctx: CliContext): void {
  const memory = program.command('memory').description('Project memory, indexes, and explicit layout migration');
  memory.action(() => { ctx.result = usageError('missing memory command. Use edges memory --help.', 'memory'); });
  addMemoryInitCommand(memory, ctx);
  addMemoryListCommand(memory, ctx);
  addMemoryGetCommand(memory, ctx);
  addMemoryDeleteCommand(memory, ctx);
  addMemoryRememberCommand(memory, ctx);
  addMemoryCreateCommand(memory, ctx);
  addMemoryUpdateCommand(memory, ctx);
  addMemoryAddTypeCommand(memory, ctx);
  addMemoryDoctorCommand(memory, ctx);
  addMemoryBackupCommand(memory, ctx);
  addMemoryRestoreCommand(memory, ctx);
  addMemoryMigrateCommand(memory, ctx);
}
