import { cpSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
const source = path.resolve(directory, '../../skills/project-memory-init/references/templates');
const destination = path.resolve(directory, '../dist/assets/memory/templates');
mkdirSync(destination, { recursive: true });
cpSync(source, destination, { recursive: true });
