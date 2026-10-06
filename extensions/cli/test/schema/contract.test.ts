import assert from 'node:assert/strict';
import { readFile, mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import { Ajv } from 'ajv';
import { Ajv2020 } from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
const statuses = ['backlog', 'todo', 'in_progress', 'in_review', 'done', 'blocked', 'cancelled'];
const priorities = ['urgent', 'high', 'medium', 'low', 'none'];

const base = { name: '', description: '', metadata: {}, body: '' };
const metadataCase = (metadata: unknown) => ({ ...base, metadata });
const cases: [string, unknown, boolean][] = [
  ['empty strings', base, true],
  ['nested metadata', metadataCase({custom: {nested: true}, tags: ['a'], count: 1, enabled: false, extra: null}), true],
  ['task type', metadataCase({'edges-type': 'task'}), true],
  ['default project', metadataCase({'edges-task-project': 'default'}), true],
  ['kebab project', metadataCase({'edges-task-project': 'team-1'}), true],
  ['64-char project', metadataCase({'edges-task-project': 'a'.repeat(64)}), true],
  ['65-char project', metadataCase({'edges-task-project': 'a'.repeat(65)}), false],
  ['directory project', metadataCase({'edges-task-project': '_default'}), false],
  ['uppercase project', metadataCase({'edges-task-project': 'Team'}), false],
  ['numeric project', metadataCase({'edges-task-project': 1}), false],
  ['empty project', metadataCase({'edges-task-project': ''}), false],
  ['malformed slug', metadataCase({'edges-task-project': 'team--a'}), false],
  ['datetime', metadataCase({'edges-updated-at': '2026-10-06T08:00:00.000Z'}), true],
  ['bad date', metadataCase({'edges-updated-at': '2026-02-30T00:00:00Z'}), false],
  ['date only', metadataCase({'edges-updated-at': '2026-10-06'}), false],
  ['numeric date', metadataCase({'edges-updated-at': 1}), false],
  ['wrong type', metadataCase({'edges-type': 'note'}), false],
  ['bad status', metadataCase({'edges-tasks-status': 'unknown'}), false],
  ['bad priority', metadataCase({'edges-task-priority': 'P1'}), false],
  ['empty title/assignee', metadataCase({'edges-title': '', 'edges-task-assignee': ''}), true],
  ['bad title', metadataCase({'edges-title': 1}), false],
  ['bad assignee', metadataCase({'edges-task-assignee': ['a']}), false],
  ['extra top-level', {...base, extra: true}, false],
  ['array metadata', metadataCase([]), false],
  ['null metadata', metadataCase(null), false],
  ...statuses.flatMap(status => [
    [`status ${status}`, metadataCase({'edges-tasks-status': status}), true] as [string, unknown, boolean],
    [`reserved project ${status}`, metadataCase({'edges-task-project': status}), false] as [string, unknown, boolean],
  ]),
  ...priorities.map(priority => [`priority ${priority}`, metadataCase({'edges-task-priority': priority}), true] as [string, unknown, boolean]),
  ...Object.keys(base).flatMap(key => {
    const missing = {...base} as Record<string, unknown>; delete missing[key];
    return [[`missing ${key}`, missing, false], [`invalid ${key}`, {...base, [key]: 1}, false]] as [string, unknown, boolean][];
  }),
];

test('generated TaskDoc preserves every v1 constraint and leaves inputs untouched', async () => {
  const schema = JSON.parse(await readFile(new URL('../../dist/schemas/task-doc.v1.json', import.meta.url), 'utf8'));
  assert.equal(schema.$schema, 'http://json-schema.org/draft-07/schema#');
  assert.equal(schema.$id, 'edges.task-doc/v1');
  assert.equal(schema.title, 'Task Doc');
  const ajv = new Ajv({ coerceTypes: false, useDefaults: false, removeAdditional: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  // Historical source is opt-in during migration, so installed copies and future regressions need no git history.
  const old = process.env.EDGES_SCHEMA_COMPAT_REF
    ? JSON.parse(execFileSync('git', ['show', `${process.env.EDGES_SCHEMA_COMPAT_REF}:extensions/cli/schemas/task-doc.v1.json`], {encoding: 'utf8'})) : undefined;
  const historical = new Ajv2020({ coerceTypes: false, useDefaults: false, removeAdditional: false });
  addFormats(historical);
  const validateOld = old ? historical.compile(old) : undefined;
  for (const [label, value, accepted] of cases) {
    const before = structuredClone(value);
    assert.equal(validate(value), accepted, `${label}: ${JSON.stringify(validate.errors)}`);
    if (validateOld) assert.equal(validateOld(value), accepted, `old ${label}`);
    assert.deepEqual(value, before, label);
  }
});

test('schema generation is byte deterministic across independent output directories', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'edges-schema-determinism-'));
  try {
    for (const child of ['a','b']) execFileSync(process.execPath, ['--import','tsx','scripts/generate-schemas.ts','--out-dir',path.join(dir, child)], {cwd: new URL('../../', import.meta.url), stdio: 'pipe'});
    const files = await readdir(path.join(dir, 'a'));
    assert.deepEqual(files, ['manifest.json','task-doc.v1.json']);
    assert.deepEqual(await readdir(path.join(dir,'b')), files);
    for (const file of files) assert.deepEqual(await readFile(path.join(dir,'a',file)), await readFile(path.join(dir,'b',file)));
  } finally { await rm(dir, {recursive: true, force: true}); }
});
