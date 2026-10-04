import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { run } from '../../src/program.js';
import { initMemory } from '../../src/services/memory/init.js';
function fixture(t: any) { const root = fs.realpathSync(fs.mkdtempSync(path.join(tmpdir(), 'directory-cli-'))); t.after(() => fs.rmSync(root, { recursive: true, force: true })); return root; }
function put(file: string, content: string) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, content); }
test('Task directory create/get/update/status/project keep assets and runlog together', async t => {
  const root = fixture(t); put(path.join(root, 'AGENTS.md'), '# Scope');
  const call = (args: string[]) => run(['--scope', root, 'tasks', ...args], { env: {} });
  const made = await call(['create', '--title', 'Unit', '--format', 'directory']); assert.equal(made.exitCode, 0, made.stdout); const item = JSON.parse(made.stdout);
  assert.match(item.path, /\/index.md$/); assert.equal(path.dirname(item.sidecarPath), path.dirname(item.path));
  put(path.join(root, path.dirname(item.path), 'image.png'), 'asset'); put(path.join(root, path.dirname(item.path), 'resource.md'), 'not a task');
  const get = await call(['get', item.path]); assert.equal(get.exitCode, 0, get.stdout);
  const list = await call(['list']); assert.equal(list.exitCode, 0, list.stdout); assert.equal(JSON.parse(list.stdout).tasks.length, 1);
  const moved = await call(['status', item.stem, 'done']); assert.equal(moved.exitCode, 0, moved.stdout); const done = JSON.parse(moved.stdout);
  assert.equal(fs.readFileSync(path.join(root, path.dirname(done.path), 'image.png'), 'utf8'), 'asset'); assert.equal(fs.existsSync(path.join(root, item.path)), false);
  const changed = await call(['update', item.stem, '--project', 'resources']); assert.equal(changed.exitCode, 0, changed.stdout); const changedItem = JSON.parse(changed.stdout);
  assert.match(changedItem.path, /resources\/done\/.*\/index.md$/); assert.equal(fs.existsSync(path.join(root, path.dirname(changedItem.path), path.basename(item.sidecarPath))), true);
});
test('Memory directory format indexes only entry, updates by same slug and doctor sees actual entry', async t => {
  const root = fixture(t); await initMemory({ targetDir: root, memoryTypes: ['project'] });
  const source = path.join(root, 'selected'); put(path.join(source, 'image.png'), 'image'); put(path.join(source, 'details.md'), 'resource');
  const call = (args: string[]) => run(['--scope', root, 'memory', ...args], { env: {} });
  const made = await call(['remember', '--type', 'project', '--slug', 'unit', '--title', 'Unit', '--description', 'Owned', '--content', '![image](image.png)', '--format', 'directory', '--resources', source]); assert.equal(made.exitCode, 0, made.stdout); const result = JSON.parse(made.stdout);
  assert.match(result.path, /project_unit\/index.md$/); assert.equal(fs.readFileSync(path.join(root, path.dirname(result.path), 'image.png'), 'utf8'), 'image');
  assert.match(fs.readFileSync(path.join(root, result.index), 'utf8'), /project_unit\/index.md/); assert.doesNotMatch(fs.readFileSync(path.join(root, result.index), 'utf8'), /details.md/);
  const updated = await call(['remember', '--type', 'project', '--slug', 'unit', '--content', 'Updated']); assert.equal(updated.exitCode, 0, updated.stdout); assert.equal(JSON.parse(updated.stdout).path, result.path);
  assert.equal(fs.existsSync(path.join(root, '.harness/memory/projects/project_unit.md')), false);
  const doctor = await call(['doctor']); assert.equal(doctor.exitCode, 0, doctor.stdout);
});
test('Note CLI preserves authored Markdown and commits only its explicit owned resource directory', async t => {
  const { execFileSync } = await import('node:child_process');
  const root = fixture(t); const git = (...args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8' });
  git('init', '-b', 'main'); git('config', 'user.name', 'Test'); git('config', 'user.email', 'test@example.test'); put(path.join(root, 'AGENTS.md'), '# Scope'); git('add', 'AGENTS.md'); git('commit', '-m', 'init');
  const source = path.join(root, 'selected'); put(path.join(source, 'photo.bin'), 'asset');
  const document = '---\ncustom: "keep this exact formatting"\n---\n# Authored title\n\n![photo](photo.bin)\n\n'; const input = path.join(root, 'authored.md'); put(input, document);
  const result = await run(['--scope', root, 'note', '--title', 'Filename title', '--content-file', input, '--markdown', '--format', 'directory', '--resources', source, '--co-author', 'Codex <noreply@openai.com>', '--dry-run'], { env: { EDGES_MODE: 'direct', EDGES_BASE_BRANCH: 'main' } });
  assert.equal(result.exitCode, 0, result.stdout); const created = JSON.parse(result.stdout);
  assert.match(created.filePath, /--filename-title\/index.md$/); const saved = fs.readFileSync(path.join(root, created.filePath), 'utf8');
  const { NoteNode } = await import('../../src/models/note-node.js'); const note = new NoteNode(path.join(root, created.filePath)).parse(saved);
  assert.equal(note.metadata?.custom, 'keep this exact formatting'); assert.equal(note.title, 'Authored title');
  assert.equal(note.body, '# Authored title\n\n![photo](photo.bin)\n\n'); assert.doesNotMatch(saved, /Ingested on|# Filename title/);
  const tracked = git('show', '--pretty=format:', '--name-only', 'HEAD'); assert.match(tracked, /photo.bin/); assert.doesNotMatch(tracked, /selected|authored.md/);
});
test('Task directory status refuses same-stem standalone destination and preserves unrelated siblings', async t => {
  const root = fixture(t); put(path.join(root, 'AGENTS.md'), '# Scope');
  const call = (args: string[]) => run(['--scope', root, 'tasks', ...args], { env: {} });
  const result = await call(['create', '--title', 'Collision', '--format', 'directory']); assert.equal(result.exitCode, 0, result.stdout); const item = JSON.parse(result.stdout);
  const collision = path.join(root, 'tasks/_default/done', item.stem + '.md'); put(collision, '# Independent'); put(path.join(root, 'tasks/_default/backlog/sibling.md'), '# Sibling');
  const move = await call(['status', item.path, 'done']); assert.notEqual(move.exitCode, 0); assert.equal(fs.existsSync(path.join(root, item.path)), true); assert.equal(fs.readFileSync(collision, 'utf8'), '# Independent'); assert.equal(fs.readFileSync(path.join(root, 'tasks/_default/backlog/sibling.md'), 'utf8'), '# Sibling');
});
test('private Memory directory entries stay ignored and owner-only', async t => {
  const { execFileSync } = await import('node:child_process');
  const root = fixture(t); execFileSync('git', ['init', '-q'], { cwd: root }); await initMemory({ targetDir: root, memoryTypes: ['user'] });
  const made = await run(['--scope', root, 'memory', 'remember', '--type', 'user', '--slug', 'private', '--title', 'Private', '--description', 'Synthetic', '--content', 'Synthetic private body', '--format', 'directory'], { env: {} });
  assert.equal(made.exitCode, 0, made.stdout); const entry = path.join(root, JSON.parse(made.stdout).path);
  assert.equal(fs.statSync(entry).mode & 0o777, 0o600); assert.equal(fs.statSync(path.dirname(entry)).mode & 0o777, 0o700);
  execFileSync('git', ['check-ignore', '-q', '--', entry], { cwd: root });
});
test('Skill type enumeration ignores resource recovery directories', async t => {
  const root = fixture(t); await initMemory({ targetDir: root, skillTypes: ['managed'] });
  put(path.join(root, '.harness/skills/managed/kept/SKILL.md'), '---\nname: kept\ndescription: Kept\n---\nBody');
  put(path.join(root, '.harness/skills/managed/.node-recovery-example/SKILL.md'), '---\nname: recovered\ndescription: Recovery only\n---\nBody');
  const { buildEntryIndex } = await import('../../src/services/memory/entries.js');
  const index = buildEntryIndex(root, 'managed'); assert.match(index, /kept\/SKILL.md/); assert.doesNotMatch(index, /recovery-example|recovered/);
});
