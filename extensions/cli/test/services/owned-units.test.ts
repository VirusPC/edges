import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { NodeService } from '../../src/services/node-service.js';
import { BaseNode, InternalNode, MemoryNode, NoteNode, SkillNode, TaskNode } from '../../src/models/index.js';
function fixture(t: any) { const dir = fs.realpathSync(fs.mkdtempSync(path.join(tmpdir(), 'owned-units-'))); t.after(() => fs.rmSync(dir, { recursive: true, force: true })); return dir; }
function put(file: string, body: string | Buffer) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, body); }
test('typed entry ownership preserves binary resources on update and destroys only its own unit', async t => {
  const root = fixture(t), entry = path.join(root, 'unit/index.md'), asset = path.join(root, 'unit/image.bin');
  put(entry, '# Title\n'); put(asset, Buffer.from([0, 255, 1])); put(path.join(root, 'other.md'), 'independent');
  const service = new NodeService(), node = (await service.get(entry, NoteNode))!;
  assert.equal(node.directoryPath, path.dirname(entry)); node.body = '# Changed\n'; await service.update(node);
  assert.deepEqual(fs.readFileSync(asset), Buffer.from([0, 255, 1]));
  await service.destroy(node); assert.equal(fs.existsSync(path.dirname(entry)), false); assert.equal(fs.readFileSync(path.join(root, 'other.md'), 'utf8'), 'independent');
});
test('standalone and organization models never own the containing directory; Skill requires SKILL.md', async t => {
  const root = fixture(t); put(path.join(root, 'note.md'), 'note'); put(path.join(root, 'image.png'), 'asset');
  const service = new NodeService(), node = (await service.get(path.join(root, 'note.md'), MemoryNode))!;
  assert.equal(node.directoryPath, undefined); assert.equal(new BaseNode(path.join(root, 'index.md')).directoryPath, undefined); assert.equal(new InternalNode(path.join(root, 'AGENTS.md')).directoryPath, undefined);
  assert.throws(() => new SkillNode(path.join(root, 'other.md')), /SKILL.md/);
  await service.destroy(node); assert.equal(fs.readFileSync(path.join(root, 'image.png'), 'utf8'), 'asset');
});
test('resource drift rejects update and deletion from the original read snapshot', async t => {
  const root = fixture(t), entry = path.join(root, 'skill/SKILL.md'), asset = path.join(root, 'skill/scripts/a.sh'); put(entry, '---\nname: demo\ndescription: demo\n---\nBody\n'); put(asset, 'before');
  const service = new NodeService(), node = (await service.get(entry, SkillNode))!; put(asset, 'after'); node.body = 'replacement';
  await assert.rejects(() => service.update(node), /resource.*changed/i); await assert.rejects(() => service.destroy(node), /resource.*changed/i); assert.match(fs.readFileSync(entry, 'utf8'), /Body/);
});
test('owned deletion removes symlinks themselves and refuses nested logical node units', async t => {
  const root = fixture(t), external = path.join(root, 'external.txt'); put(external, 'outside');
  const entry = path.join(root, 'unit/index.md'); put(entry, 'unit'); fs.symlinkSync(external, path.join(root, 'unit/link'));
  const service = new NodeService(); await service.destroy((await service.get(entry, TaskNode))!); assert.equal(fs.readFileSync(external, 'utf8'), 'outside');
  put(entry, 'unit'); put(path.join(root, 'unit/child/AGENTS.md'), '# Child scope');
  await assert.rejects(async () => service.destroy((await service.get(entry, TaskNode))!), /nested|logical|ambiguous/i); assert.equal(fs.existsSync(entry), true);
});
test('owned create rejects adoption of a preexisting resource directory', async t => {
  const root = fixture(t); put(path.join(root, 'unit/asset'), 'existing');
  await assert.rejects(() => new NodeService().create(new NoteNode(path.join(root, 'unit/index.md')).parse('new')), /exists|owned/i);
});
test('move keeps unit bytes, permissions, identity and parent labels while returning a new path', async t => {
  const root = fixture(t), entry = path.join(root, 'old/index.md'), dest = path.join(root, 'new/index.md'); put(entry, '---\nid: stable\n---\nBefore\n'); put(path.join(root, 'old/tool'), 'tool'); fs.chmodSync(path.join(root, 'old/tool'), 0o700);
  const service = new NodeService(), node = (await service.get(entry, TaskNode))!;
  const parent = new InternalNode(path.join(root, 'AGENTS.md')); await service.create(parent); await service.attach(parent, node, 'local'); parent.updateChild({ target: 'old/index.md', kind: 'local', label: 'Kept', description: 'Details' }); await service.update(parent);
  node.body = 'Changed\n'; const moved = await service.move(node, dest, parent);
  assert.equal(node.path, entry); assert.equal(moved.path, dest); assert.equal(moved.id, 'stable'); assert.equal(moved.body, 'Changed\n'); assert.equal(fs.existsSync(path.dirname(entry)), false);
  assert.equal(fs.readFileSync(path.join(root, 'new/tool'), 'utf8'), 'tool'); assert.equal(fs.statSync(path.join(root, 'new/tool')).mode & 0o777, 0o700);
  assert.deepEqual(parent.children, [{ target: 'new/index.md', label: 'Kept', description: 'Details', kind: 'local' }]);
  await assert.rejects(() => service.update(node), /snapshot/);
});
test('move refuses occupied directories, format conversion and denied destination before touching resources', async t => {
  const root = fixture(t), entry = path.join(root, 'old/index.md'); put(entry, 'Before'); put(path.join(root, 'old/asset'), 'bytes'); put(path.join(root, 'occupied/other'), 'other');
  const service = new NodeService({ assertWrite: ({ node }) => { if (node.path.includes('/denied/')) throw new Error('Denied'); } }), node = (await service.get(entry, NoteNode))!;
  await assert.rejects(() => service.move(node, path.join(root, 'occupied/index.md')), /exists/);
  await assert.rejects(() => service.move(node, path.join(root, 'flat.md')), /format|layout/);
  await assert.rejects(() => service.move(node, path.join(root, 'denied/index.md')), /Denied/);
  assert.equal(fs.readFileSync(path.join(root, 'old/asset'), 'utf8'), 'bytes');
});
test('explicit resource import copies only selected directory bytes and rejects links before entry creation', async t => {
  const root = fixture(t), source = path.join(root, 'selected'); put(path.join(source, 'image.bin'), Buffer.from([255, 0])); put(path.join(root, 'neighbor'), 'not imported');
  const service = new NodeService({ createMode: () => 0o600, resourceMode: () => 0o600 }), node = new NoteNode(path.join(root, 'note/index.md')).parse('# Note\n');
  await service.create(node, undefined, { resources: source });
  assert.deepEqual(fs.readFileSync(path.join(root, 'note/image.bin')), Buffer.from([255, 0])); assert.equal(fs.statSync(path.join(root, 'note/image.bin')).mode & 0o777, 0o600); assert.equal(fs.existsSync(path.join(root, 'note/neighbor')), false);
  fs.symlinkSync(path.join(root, 'neighbor'), path.join(source, 'link'));
  await assert.rejects(() => service.create(new NoteNode(path.join(root, 'bad/index.md')), undefined, { resources: source }), /symbolic|symlink/i); assert.equal(fs.existsSync(path.join(root, 'bad')), false);
});
test('move restores resource bytes and original index when a post-rename permission check fails', async t => {
  const root = fixture(t), source = path.join(root, 'old/index.md'), destination = path.join(root, 'new/index.md'); put(source, 'original'); put(path.join(root, 'old/asset'), 'resource');
  const service = new NodeService({ assertWrite: ({ operation, node }) => { if (operation === 'move' && node.path === destination && fs.existsSync(destination)) throw new Error('Changed policy'); } });
  const node = (await service.get(source, NoteNode))!, parent = new InternalNode(path.join(root, 'AGENTS.md')); await service.create(parent); await service.attach(parent, node, 'local'); const before = fs.readFileSync(parent.path, 'utf8'); node.body = 'new';
  await assert.rejects(() => service.move(node, destination, parent), /restored/); assert.equal(fs.readFileSync(source, 'utf8'), 'original'); assert.equal(fs.readFileSync(path.join(root, 'old/asset'), 'utf8'), 'resource'); assert.equal(fs.readFileSync(parent.path, 'utf8'), before); assert.equal(fs.existsSync(destination), false);
});
test('destroy checks the owned recovery directory before staging private resources', async t => {
  const root = fixture(t), entry = path.join(root, 'unit/index.md'); put(entry, 'private'); put(path.join(root, 'unit/secret'), 'bytes');
  const service = new NodeService({ assertWrite: ({ node }) => { if (node.path.includes('.node-recovery-')) throw new Error('Recovery directory is not ignored'); } }), node = (await service.get(entry, MemoryNode))!;
  await assert.rejects(() => service.destroy(node), /not ignored/); assert.equal(fs.readFileSync(entry, 'utf8'), 'private'); assert.equal(fs.readFileSync(path.join(root, 'unit/secret'), 'utf8'), 'bytes');
});
test('owned write refuses a replaced resource inode and known readonly source', async t => {
  const root = fixture(t), entry = path.join(root, 'unit/index.md'), asset = path.join(root, 'unit/asset'); put(entry, 'body'); put(asset, 'same');
  const service = new NodeService(), node = (await service.get(entry, MemoryNode))!; fs.renameSync(asset, asset + '.old'); put(asset, 'same'); fs.unlinkSync(asset + '.old');
  await assert.rejects(() => service.move(node, path.join(root, 'moved/index.md')), /resources changed/);
  const index = path.join(root, 'AGENTS.md'); put(index, '<!-- project-memory-type:start -->\nname: referenced\nmodule: memory\nwritable: false\n<!-- project-memory-type:end -->\n<!-- project-memory-entries:start -->\n- [Unit](unit/index.md) — readonly\n<!-- project-memory-entries:end -->\n');
  const readonly = new NodeService(); await readonly.list(root); const alias = (await readonly.get(entry, MemoryNode))!;
  await assert.rejects(() => readonly.destroy(alias), /Read-only/); assert.equal(fs.existsSync(asset), true);
});
test('destroy detects replacement of a staged resource directory and never deletes the replacement', async t => {
  const root = fixture(t), entry = path.join(root, 'unit/index.md'); put(entry, 'original'); put(path.join(root, 'unit/asset'), 'owned');
  let replaced = false;
  const service = new NodeService({ assertWrite: ({ operation, node }) => {
    if (operation !== 'destroy' || path.basename(node.path) !== 'AGENTS.md') return;
    const staged = fs.readdirSync(root).find(name => name.startsWith('.node-recovery-'));
    if (staged && !replaced) { replaced = true; fs.renameSync(path.join(root, staged), path.join(root, 'saved-original')); put(path.join(root, staged, 'unrelated'), 'leave alone'); }
  } });
  const node = (await service.get(entry, NoteNode))!, parent = new InternalNode(path.join(root, 'AGENTS.md')); await service.create(parent); await service.attach(parent, node, 'local');
  await assert.rejects(() => service.destroy(node, parent), /changed|cleanup|recovery/i);
  const staged = fs.readdirSync(root).find(name => name.startsWith('.node-recovery-'))!;
  assert.equal(fs.readFileSync(path.join(root, staged, 'unrelated'), 'utf8'), 'leave alone'); assert.equal(fs.readFileSync(path.join(root, 'saved-original/asset'), 'utf8'), 'owned');
});
test('known readonly unit provenance covers its resources even through untyped file loads', async t => {
  const root = fixture(t), asset = path.join(root, 'unit/resource.md'); put(path.join(root, 'unit/SKILL.md'), '---\nname: unit\ndescription: read only\n---\nBody'); put(asset, 'original');
  put(path.join(root, 'AGENTS.md'), '<!-- project-memory-type:start -->\nname: referenced\nmodule: skills\nwritable: false\n<!-- project-memory-type:end -->\n<!-- project-memory-entries:start -->\n- [Skill](unit/SKILL.md) — installed\n<!-- project-memory-entries:end -->\n');
  const service = new NodeService(); await service.list(root); const resource = (await service.get(asset))!; resource.body = 'changed';
  await assert.rejects(() => service.update(resource), /Read-only/); await assert.rejects(() => service.create(new BaseNode(path.join(root, 'unit/new.md'))), /Read-only/); assert.equal(fs.readFileSync(asset, 'utf8'), 'original');
});
test('owned creation does not adopt a directory introduced during asynchronous permission checks', async t => {
  const root = fixture(t), entry = path.join(root, 'unit/index.md');
  const service = new NodeService({ assertWrite: () => { if (!fs.existsSync(path.dirname(entry))) put(path.join(root, 'unit/independent'), 'outside ownership'); } });
  await assert.rejects(() => service.create(new NoteNode(entry)), /exists/); assert.equal(fs.existsSync(entry), false); assert.equal(fs.readFileSync(path.join(root, 'unit/independent'), 'utf8'), 'outside ownership');
});
