import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as fs from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { BaseNode, InternalNode, MemoryNode, NoteNode, SkillNode, TaskNode } from '../../src/models/index.js';
import { NodeService } from '../../src/services/node-service.js';

function fixture(t: { after(fn: () => void): void }) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(tmpdir()), 'node-service-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const file = (name: string) => path.join(root, name);
  const write = (name: string, source: string) => { fs.mkdirSync(path.dirname(file(name)), { recursive: true }); fs.writeFileSync(file(name), source); return file(name); };
  return { root, file, write };
}
function index(local = '', descendants = '') {
  return `# Scope\n\n<!-- project-memory-important:start -->\nKeep constraints.\n<!-- project-memory-important:end -->\n<!-- project-memory-local:start -->\n${local}\n<!-- project-memory-local:end -->\n<!-- project-memory-children:start -->\n${descendants}\n<!-- project-memory-children:end -->\n`;
}
const taskSource = '---\nname: One\nmetadata:\n  edges-tasks-status: todo\n---\nTask body.\n';

test('create with placement persists task and index and establishes reciprocal context', async t => {
  const { root, file } = fixture(t), service = new NodeService();
  const parent = new InternalNode(file('AGENTS.md')).parse(index());
  await service.create(parent);
  const task = new TaskNode(file('tasks/one.md')).parse(taskSource);
  await service.create(task, { parent, kind: 'local' });
  assert.equal((await service.get(task.path, TaskNode))?.title, 'One');
  assert.equal(task.parent?.target, parent.path);
  assert.equal(parent.children[0]?.target, 'tasks/one.md');
  assert.deepEqual((await service.list(root)).map(n => n.path), [parent.path, task.path]);
  assert.match(fs.readFileSync(parent.path, 'utf8'), /Keep constraints/);
});

test('get is explicit, independent of YAML fields and physical ancestors, and only absence returns undefined', async t => {
  const { file, write } = fixture(t), service = new NodeService();
  write('AGENTS.md', index('- [task](one.md)'));
  write('one.md', taskSource);
  const node = await service.get(file('one.md'));
  assert.equal(node?.type, 'base'); assert.equal(node?.parent, undefined);
  assert.equal((await service.get(file('one.md'), TaskNode))?.title, 'One');
  assert.equal(await service.get(file('missing.md')), undefined);
  await assert.rejects(service.get('one.md'), /absolute/);
  await assert.rejects(service.get(file('')), /regular file/);
});

test('list follows unlimited local chains in stable preorder and filters descendants before loading', async t => {
  const { root, write, file } = fixture(t), service = new NodeService();
  write('AGENTS.md', index('- [A](a/AGENTS.md)\n- [A again](a/AGENTS.md#second)', '- [missing](missing/AGENTS.md)'));
  write('a/AGENTS.md', index('- [B](../elsewhere/b/AGENTS.md)', '- [not a file](../unreadable/AGENTS.md)'));
  write('unreadable/AGENTS.md/placeholder', '');
  write('elsewhere/b/AGENTS.md', index('- [entry](../../data/a%20b.md#heading)'));
  write('data/a b.md', '# Entry');
  assert.deepEqual((await service.list(root)).map(n => n.path), ['AGENTS.md', 'a/AGENTS.md', 'elsewhere/b/AGENTS.md', 'data/a b.md'].map(file));
  await assert.rejects(service.list(root, { includeDescendants: true }), /regular file|Missing/);
  assert.match(fs.readFileSync(file('elsewhere/b/AGENTS.md'), 'utf8'), /a%20b.md#heading/);
});

test('included descendant traversal remains opt-in after previous loads and rejects missing roots and local targets', async t => {
  const { root, write, file } = fixture(t), service = new NodeService();
  write('AGENTS.md', index('', '- [child](child/AGENTS.md)')); write('child/AGENTS.md', index());
  assert.equal((await service.list(root, { includeDescendants: true })).length, 2);
  assert.equal((await service.list(root)).length, 1);
  await assert.rejects(service.list(file('missing')), /Missing/);
  write('AGENTS.md', index('- [missing](missing.md)'));
  await assert.rejects(service.list(root), /Missing/);
});

test('list refuses ownership cycles but deduplicates repeated references', async t => {
  const { root, write } = fixture(t), service = new NodeService();
  write('AGENTS.md', index('- [A](a/AGENTS.md)')); write('a/AGENTS.md', index('- [root](../AGENTS.md)'));
  await assert.rejects(service.list(root), /cycle/i);
});

test('type indexes select Memory and Skill without treating ordinary YAML as a type registry', async t => {
  const { root, write } = fixture(t), service = new NodeService();
  write('AGENTS.md', index('- [memory](mem/AGENTS.md)\n- [skills](skills/AGENTS.md)'));
  write('mem/AGENTS.md', '<!-- project-memory-type:start -->\nname: project\nmodule: memory\nwritable: true\ngitignore: false\nformat: ordinary\n<!-- project-memory-type:end -->\n<!-- project-memory-entries:start -->\n- [entry](entry.md)\n<!-- project-memory-entries:end -->\n');
  write('mem/entry.md', '---\ndescription: Memory\n---\nBody');
  write('skills/AGENTS.md', '<!-- project-memory-type:start -->\nname: managed\nmodule: skills\nwritable: true\ngitignore: false\nformat: skills\n<!-- project-memory-type:end -->\n<!-- project-memory-entries:start -->\n- [skill](sample/SKILL.md)\n<!-- project-memory-entries:end -->\n');
  write('skills/sample/SKILL.md', '---\nname: sample\ndescription: Skill\n---\nSteps');
  const nodes = await service.list(root);
  assert.deepEqual(nodes.map(n => n.type), ['internal', 'internal', 'memory', 'internal', 'skill']);
  assert.ok(nodes[2] instanceof MemoryNode); assert.ok(nodes[4] instanceof SkillNode);
});

test('update preserves permissions, refuses missing/stale/substituted sources and does not create', async t => {
  const { file, write } = fixture(t), service = new NodeService();
  write('note.md', '# Before\n'); fs.chmodSync(file('note.md'), 0o640);
  const note = (await service.get(file('note.md'), NoteNode))!;
  note.title = 'After'; await service.update(note);
  assert.equal(fs.statSync(note.path).mode & 0o777, 0o640);
  assert.match(fs.readFileSync(note.path, 'utf8'), /# After/);
  write('note.md', '# External\n'); note.title = 'Wrong';
  await assert.rejects(service.update(note), /source changed|stale/i);
  assert.equal(fs.readFileSync(note.path, 'utf8'), '# External\n');
  const fresh = (await service.get(note.path))!;
  fs.renameSync(note.path, file('old.md')); write('note.md', '# External\n');
  await assert.rejects(service.update(fresh), /identity|changed/i);
  fs.unlinkSync(note.path); await assert.rejects(service.update(fresh), /missing|regular file/i);
  await assert.rejects(service.update(new BaseNode(file('new.md')).parse('new')), /load|read|snapshot/i);
  assert.equal(fs.existsSync(file('new.md')), false);
});

test('create refuses any existing target, and invalid placement leaves no child file or changed index', async t => {
  const { file, write } = fixture(t), service = new NodeService();
  write('AGENTS.md', index()); const parent = (await service.get(file('AGENTS.md'), InternalNode))!;
  await assert.rejects(service.create(new BaseNode(parent.path)), /exist/i);
  const child = new BaseNode(file('new.md')).parse('new');
  write('AGENTS.md', index('External edit'));
  await assert.rejects(service.create(child, { parent, kind: 'local' }), /source changed|stale/i);
  assert.equal(fs.existsSync(child.path), false); assert.equal(parent.children.length, 0); assert.equal(child.parent, undefined);
});

test('reads and writes reject symlink files and directories without touching their targets', async t => {
  const { file, write } = fixture(t), service = new NodeService();
  write('real/one.md', 'original'); fs.symlinkSync(file('real/one.md'), file('link.md'));
  fs.symlinkSync(file('real'), file('alias'));
  for (const target of ['link.md', 'alias/one.md']) {
    await assert.rejects(service.get(file(target)), /symbolic|symlink/i);
    await assert.rejects(service.create(new BaseNode(file(target)).parse('bad')), /symbolic|symlink|exist/i);
  }
  const loaded = (await service.get(file('real/one.md')))!;
  fs.renameSync(file('real'), file('moved')); fs.symlinkSync(file('moved'), file('real'));
  await assert.rejects(service.update(loaded), /symbolic|symlink|identity/i);
  assert.equal(fs.readFileSync(file('moved/one.md'), 'utf8'), 'original');
});

test('attach, reparent and detach persist ownership without moving files, preserving authored label and description', async t => {
  const { file, write } = fixture(t), service = new NodeService();
  write('old/AGENTS.md', index('- [Custom label](../content.md) — authored description'));
  write('new/deep/AGENTS.md', index()); write('content.md', 'body');
  const oldParent = (await service.get(file('old/AGENTS.md'), InternalNode))!;
  const newParent = (await service.get(file('new/deep/AGENTS.md'), InternalNode))!;
  const child = (await service.get(file('content.md')))!;
  await service.reparent(child, oldParent, newParent, 'descendant');
  assert.equal(oldParent.children.length, 0);
  assert.deepEqual(newParent.children, [{ target: '../../content.md', label: 'Custom label', description: 'authored description', kind: 'descendant' }]);
  assert.equal(child.parent?.target, newParent.path); assert.equal(fs.readFileSync(child.path, 'utf8'), 'body');
  await service.detach(newParent, child);
  assert.equal(child.parent, undefined); assert.equal(newParent.children.length, 0);
  await service.attach(oldParent, child, 'local'); assert.equal(child.parent?.target, oldParent.path);
  assert.equal((await service.get(oldParent.path, InternalNode))!.children.length, 1);
});

test('ownership edits reject conflicts, missing documents and cycles before changing any document', async t => {
  const { file, write } = fixture(t), service = new NodeService();
  write('AGENTS.md', index()); write('child/AGENTS.md', index()); write('other/AGENTS.md', index());
  const root = (await service.get(file('AGENTS.md'), InternalNode))!;
  const child = (await service.get(file('child/AGENTS.md'), InternalNode))!;
  const other = (await service.get(file('other/AGENTS.md'), InternalNode))!;
  await service.attach(root, child, 'local');
  await assert.rejects(service.attach(other, child, 'local'), /parent|ownership/i);
  await assert.rejects(service.attach(child, root, 'local'), /cycle/i);
  await assert.rejects(service.attach(root, root, 'local'), /self|cycle/i);
  await assert.rejects(service.detach(other, child), /indexed|parent|ownership/i);
  await assert.rejects(service.attach(root, new BaseNode(file('absent.md')), 'local'), /missing|load|read|snapshot/i);
  assert.equal(other.children.length, 0); assert.equal(child.children.length, 0);
});

test('update index synchronizes all loaded reciprocal relations and rejects a introduced cycle', async t => {
  const { root, file, write } = fixture(t), service = new NodeService();
  write('AGENTS.md', index('- [child](child.md)')); write('child.md', 'child');
  const nodes = await service.list(root), parent = nodes[0] as InternalNode, child = nodes[1]!;
  parent.removeChild({ target: 'child.md' }); await service.update(parent);
  assert.equal(child.parent, undefined);
  parent.addChild({ target: 'child.md', kind: 'local' }); await service.update(parent);
  assert.equal(child.parent?.target, parent.path);
  parent.addChild({ target: 'AGENTS.md', kind: 'local' });
  await assert.rejects(service.update(parent), /cycle|self/i);
  assert.equal((await service.get(file('AGENTS.md'), InternalNode))!.children.length, 1);
});

test('destroy rejects children, detaches using known context and leaves unknown external references alone', async t => {
  const { root, file, write } = fixture(t), service = new NodeService();
  write('AGENTS.md', index('- [child](child.md)')); write('child.md', 'child');
  const [parent, child] = await service.list(root);
  await assert.rejects(service.destroy(parent!), /children/i);
  await service.destroy(child!);
  assert.equal(fs.existsSync(file('child.md')), false);
  assert.equal((await service.get(file('AGENTS.md'), InternalNode))!.children.length, 0);
  write('child.md', 'child'); write('external/AGENTS.md', index('- [child](../child.md)'));
  await service.destroy((await service.get(file('child.md')))!);
  assert.match(fs.readFileSync(file('external/AGENTS.md'), 'utf8'), /child.md/);
});

test('reparent preflights both parents and preserves every file and relation on stale destination', async t => {
  const { root, file, write } = fixture(t), service = new NodeService();
  write('AGENTS.md', index('- [child](child.md)')); write('child.md', 'child'); write('new/AGENTS.md', index());
  const [parent, child] = await service.list(root), next = (await service.get(file('new/AGENTS.md'), InternalNode))!;
  const before = fs.readFileSync(parent!.path, 'utf8'); write('new/AGENTS.md', 'external');
  await assert.rejects(service.reparent(child!, parent as InternalNode, next, 'local'), /source changed|stale/i);
  assert.equal(fs.readFileSync(parent!.path, 'utf8'), before); assert.equal(child!.parent?.target, parent!.path);
});

test('explicit referenced indexes can read linked skills but their discovered source remains read-only', async t => {
  const { root, file, write } = fixture(t), service = new NodeService();
  write('AGENTS.md', index('- [reference index](refs/AGENTS.md)'));
  write('refs/AGENTS.md', '<!-- project-memory-type:start -->\nname: referenced\nmodule: skills\nwritable: false\ngitignore: false\nformat: skills\n<!-- project-memory-type:end -->\n<!-- project-memory-entries:start -->\n- [skill](linked/SKILL.md)\n<!-- project-memory-entries:end -->\n');
  write('installed/SKILL.md', '---\nname: installed\ndescription: source\n---\nOriginal');
  fs.symlinkSync(file('installed'), file('refs/linked'));
  const nodes = await service.list(root), skill = nodes[2]!;
  assert.equal(skill.type, 'skill'); skill.body = 'modified';
  await assert.rejects(service.update(skill), /read.only/i);
  await assert.rejects(service.destroy(skill), /read.only/i);
  assert.match(fs.readFileSync(file('installed/SKILL.md'), 'utf8'), /Original/);
});

test('production hooks supply module constructors and preflight write permissions', async t => {
  const { root, file, write } = fixture(t);
  const service = new NodeService({
    modelForReference: (_parent, _reference, target) => target.endsWith('task.md') ? TaskNode : undefined,
    assertWrite: context => { if (context.node.path.endsWith('task.md')) throw new Error('Private destination is not ignored'); },
  });
  write('AGENTS.md', index('- [task](task.md)')); write('task.md', taskSource);
  const nodes = await service.list(root); assert.equal(nodes[1]?.type, 'task');
  await assert.rejects(service.update(nodes[1]!), /Private destination/);
  await assert.rejects(service.destroy(nodes[1]!), /Private destination/);
  assert.equal(fs.existsSync(file('task.md')), true);
});

test('destroy cannot bypass persisted AGENTS children by loading a BaseNode or removing children only in memory', async t => {
  const { file, write } = fixture(t), service = new NodeService();
  write('AGENTS.md', index('- [child](child.md)')); write('child.md', 'child');
  await assert.rejects(service.destroy((await service.get(file('AGENTS.md')))! ), /children/i);
  const parent = (await service.get(file('AGENTS.md'), InternalNode))!;
  parent.removeChild({ target: 'child.md' });
  await assert.rejects(service.destroy(parent), /children/i);
  assert.equal(fs.existsSync(parent.path), true);
});

test('destroy updates the already loaded parent document as well as the child back reference', async t => {
  const { root, write } = fixture(t), service = new NodeService();
  write('AGENTS.md', index('- [child](child.md)')); write('child.md', 'child');
  const [parent, child] = await service.list(root);
  await service.destroy(child!);
  assert.equal(parent!.children?.length, 0); assert.equal(child!.parent, undefined);
});

test('index-only ownership operations can detach a read-only linked source without writing that source', async t => {
  const { root, file, write } = fixture(t), service = new NodeService();
  write('AGENTS.md', index('- [reference index](refs/AGENTS.md)'));
  write('refs/AGENTS.md', '<!-- project-memory-type:start -->\nname: referenced\nmodule: skills\nwritable: false\n<!-- project-memory-type:end -->\n<!-- project-memory-entries:start -->\n- [skill](linked/SKILL.md)\n<!-- project-memory-entries:end -->\n');
  write('installed/SKILL.md', 'Original'); fs.symlinkSync(file('installed'), file('refs/linked'));
  const nodes = await service.list(root), parent = nodes[1] as InternalNode, skill = nodes[2]!;
  await service.detach(parent, skill);
  assert.equal(skill.parent, undefined); assert.equal(parent.children.length, 0);
  await service.attach(parent, skill, 'local');
  assert.equal(skill.parent?.target, parent.path); assert.equal(fs.readFileSync(file('installed/SKILL.md'), 'utf8'), 'Original');
});

test('multi-file write failure recovers previous bytes and reports affected paths instead of claiming atomicity', async t => {
  const { root, file, write } = fixture(t), service = new NodeService();
  write('AGENTS.md', index('- [child](child.md)')); write('child.md', 'child'); write('next/AGENTS.md', index());
  const [parent, child] = await service.list(root), next = (await service.get(file('next/AGENTS.md'), InternalNode))!;
  const before = fs.readFileSync(parent!.path, 'utf8'), destination = fs.readFileSync(next.path, 'utf8');
  // All filesystem effects remain real; only the second rename's OS failure is injected.
  const { default: mutableFs } = await import('node:fs');
  const { syncBuiltinESMExports } = await import('node:module');
  const rename = mutableFs.renameSync;
  let failed = false;
  const mocked = t.mock.method(mutableFs, 'renameSync', (source: fs.PathLike, target: fs.PathLike) => {
    if (target === next.path && !failed) { failed = true; throw new Error('Simulated second-file rename failure'); }
    return rename(source, target);
  });
  syncBuiltinESMExports();
  t.after(() => { mocked.mock.restore(); syncBuiltinESMExports(); });
  await assert.rejects(service.reparent(child!, parent as InternalNode, next, 'local'), error => {
    assert.match(String(error), /Affected:.*AGENTS.md/); assert.match(String(error), /Recovered:.*AGENTS.md/);
    assert.match(String(error), /Unrecovered: \(none\)/); return true;
  });
  assert.equal(fs.readFileSync(parent!.path, 'utf8'), before);
  assert.equal(fs.readFileSync(next.path, 'utf8'), destination);
  assert.equal(child!.parent?.target, parent!.path); assert.equal(parent!.children?.length, 1);
  assert.equal(fs.readdirSync(root).some(name => name.startsWith('.node-')), false);
});

test('create and attach preserve discovered index-only source permissions across later writes', async t => {
  const { file, write } = fixture(t), service = new NodeService();
  write('refs/AGENTS.md', '<!-- project-memory-type:start -->\nname: referenced\nmodule: skills\nwritable: false\n<!-- project-memory-type:end -->\n<!-- project-memory-entries:start -->\n<!-- project-memory-entries:end -->\n');
  const parent = (await service.get(file('refs/AGENTS.md'), InternalNode))!;
  const fresh = new SkillNode(file('fresh/SKILL.md')).parse('Original');
  await assert.rejects(service.create(fresh, { parent, kind: 'local' }), /read.only/i);
  assert.equal(fs.existsSync(fresh.path), false);
  write('existing/SKILL.md', 'Original'); const existing = (await service.get(file('existing/SKILL.md'), SkillNode))!;
  await service.attach(parent, existing, 'local'); existing.body = 'changed';
  await assert.rejects(service.update(existing), /read.only/i);
  await assert.rejects(service.destroy(existing), /read.only/i);
  assert.equal(fs.readFileSync(existing.path, 'utf8'), 'Original');
});

test('ambiguous authored multi-link index edits reject before writing or clearing child context', async t => {
  const { root, write } = fixture(t), service = new NodeService();
  write('AGENTS.md', index('- [one](one.md) and [two](two.md)')); write('one.md', 'one'); write('two.md', 'two');
  const [parent, one] = await service.list(root), before = fs.readFileSync(parent!.path, 'utf8');
  await assert.rejects(service.detach(parent as InternalNode, one!), /multi-link/i);
  assert.equal(fs.readFileSync(parent!.path, 'utf8'), before); assert.equal(one!.parent?.target, parent!.path);
});

test('encoded filename delimiters stay distinct from query and fragment and survive newly authored ownership', async t => {
  const { root, file, write } = fixture(t), service = new NodeService();
  write('AGENTS.md', index('- [hash](a%23b.md#heading)\n- [percent](a%2523b.md?view=1)\n- [question](a%3Fb.md)\n- [literal percent](a%25b.md)'));
  write('a#b.md', 'hash'); write('a%23b.md', 'percent'); write('a?b.md', 'question'); write('a%b.md', 'literal percent');
  assert.deepEqual((await service.list(root)).map(n => n.path), ['AGENTS.md', 'a#b.md', 'a%23b.md', 'a?b.md', 'a%b.md'].map(file));
  const parent = (await service.get(file('AGENTS.md'), InternalNode))!;
  const newChild = new BaseNode(file('has space.md')).parse('space');
  await service.create(newChild, { parent, kind: 'local' });
  assert.deepEqual((await service.list(root)).map(n => n.path), ['AGENTS.md', 'a#b.md', 'a%23b.md', 'a?b.md', 'a%b.md', 'has space.md'].map(file));
});

test('parent context resolves encoded scope directory names for destroy after list', async t => {
  const { file, write } = fixture(t), service = new NodeService();
  write('scope#one/AGENTS.md', index('- [child](child.md)')); write('scope#one/child.md', 'body');
  const [parent, child] = await service.list(file('scope#one'));
  await service.destroy(child!);
  assert.equal(parent!.children?.length, 0);
  assert.equal(fs.existsSync(file('scope#one/child.md')), false);
});

test('successful index writes synchronize clean loaded copies without overwriting unsaved edits', async t => {
  const { root, file, write } = fixture(t), service = new NodeService();
  write('AGENTS.md', index('- [child](child.md)')); write('child.md', 'body');
  const [first, child] = await service.list(root);
  const second = (await service.get(file('AGENTS.md'), InternalNode))!;
  const dirty = (await service.get(file('AGENTS.md'), InternalNode))!;
  dirty.setConstraints(['Unsaved constraints']);
  second.updateChild({ target: 'child.md', label: 'changed', kind: 'local' });
  await service.update(second);
  assert.equal(first!.children?.[0]?.label, 'changed');
  assert.deepEqual(dirty.content.constraints, ['Unsaved constraints']);
  await service.destroy(child!);
  assert.equal(first!.children?.length, 0); assert.equal(second.children.length, 0);
});

test('failed rollback retains original bytes in a recovery file and reports its concrete location', async t => {
  const { root, file, write } = fixture(t), service = new NodeService();
  write('AGENTS.md', index('- [child](child.md)')); write('child.md', 'body'); write('next/AGENTS.md', index());
  const [parent, child] = await service.list(root), next = (await service.get(file('next/AGENTS.md'), InternalNode))!;
  const before = fs.readFileSync(parent!.path, 'utf8'), mode = fs.statSync(parent!.path).mode & 0o777;
  const { default: mutableFs } = await import('node:fs');
  const { syncBuiltinESMExports } = await import('node:module');
  const rename = mutableFs.renameSync;
  let firstWritten = false;
  const mocked = t.mock.method(mutableFs, 'renameSync', (source: fs.PathLike, target: fs.PathLike) => {
    if (target === next.path || (target === parent!.path && firstWritten)) throw new Error('Persistent rename failure');
    rename(source, target); firstWritten = true;
  });
  syncBuiltinESMExports(); t.after(() => { mocked.mock.restore(); syncBuiltinESMExports(); });
  await assert.rejects(service.reparent(child!, parent as InternalNode, next, 'local'), error => {
    assert.match(String(error), /Unrecovered:.*AGENTS.md/);
    const recovery = fs.readdirSync(root).find(name => name.startsWith('.node-recovery-'));
    assert.ok(recovery); assert.ok(String(error).includes(file(recovery)));
    assert.equal(fs.readFileSync(file(recovery), 'utf8'), before);
    assert.equal(fs.statSync(file(recovery)).mode & 0o777, mode);
    return true;
  });
});
