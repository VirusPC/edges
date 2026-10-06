import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGenerator } from 'ts-json-schema-generator';
import { SCHEMA_CONTRACTS } from './schema-contracts.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
if (args.length && (args.length !== 2 || args[0] !== '--out-dir')) throw new Error('Usage: generate-schemas.ts [--out-dir <directory>]');
const directory = args.length ? path.resolve(args[1]!) : path.join(root, 'dist/schemas');
await mkdir(directory, {recursive: true});
const manifest = [];
for (const contract of SCHEMA_CONTRACTS) {
  const schema = createGenerator({
    path: path.join(root, contract.path), tsconfig: path.join(root, 'tsconfig.json'),
    type: contract.type, schemaId: contract.id, jsDoc: 'extended', extraTags: ['not'], topRef: false,
  }).createSchema(contract.type);
  if (typeof schema.title !== 'string' || typeof schema.description !== 'string') throw new Error(`${contract.type} requires title and description annotations`);
  manifest.push({key: contract.key, id: contract.id, title: schema.title, description: schema.description, file: contract.file});
  await writeFile(path.join(directory, contract.file), JSON.stringify(schema, null, 2) + '\n');
}
await writeFile(path.join(directory, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
