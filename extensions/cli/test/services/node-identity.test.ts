import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as fs from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { BaseNode, InternalNode, LeafNode } from '../../src/models/index.js';
import { NodeService } from '../../src/services/node-service.js';
function fixture(t: { after(fn: () => void): void }) {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(tmpdir()), 'node-identity-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const entry = path.join(root, 'AGENTS.md');
  fs.writeFileSync(entry, new InternalNode(entry).parse('# Root\n\nHuman introduction.\n').serialize());
  return { root, entry, service: new NodeService({ managedRoot: root }) };
}
test('concurrent get, relative path, query and list share one instance per Service', async t => {
  const { root, entry, service } = fixture(t);
  const [a, b] = await Promise.all([service.get(entry), service.get(path.relative(process.cwd(), entry))]);
  assert.strictEqual(a, b);
  assert.strictEqual(await service.get(entry, BaseNode), a);
  assert.ok(a instanceof InternalNode);
  a.setConstraints(['shared constraint']);
  assert.strictEqual(await service.query(root).find(n => n.path === entry).value(), a);
  assert.strictEqual((await service.list(root)).find(n => n.path === entry), a);
  assert.notStrictEqual(await new NodeService({ managedRoot: root }).get(entry), a);
  await assert.rejects(service.get(entry, LeafNode), /model|type/i);
});
for (const operation of ['create', 'import'] as const) {
  test(`${operation} saves affected parent current constraints, body and metadata only`, async t => {
    const { root, entry, service } = fixture(t);
    const parent = (await service.get(entry, InternalNode))!;
    const unrelated = await service.create(new LeafNode(path.join(root, 'other/index.md')), { body: 'Original\n' });
    const bytes = fs.readFileSync(unrelated.path, 'utf8');
    unrelated.body = 'Unsaved unrelated\n';
    parent.setConstraints(['shared constraint']);
    parent.body = parent.body.replace('Human introduction.', 'Edited introduction.');
    parent.setMetadata('vendor', { version: 2 });
    const destination = path.join(root, 'child/index.md');
    let child: BaseNode;
    if (operation === 'create') child = await service.create(new LeafNode(destination), { body: 'Child\n' });
    else {
      const external = fs.mkdtempSync(path.join(fs.realpathSync(tmpdir()), 'import-identity-'));
      t.after(() => fs.rmSync(external, { recursive: true, force: true }));
      fs.writeFileSync(path.join(external, 'index.md'), 'Child\n');
      child = await service.import(path.join(external, 'index.md'), destination);
    }
    const disk = new InternalNode(entry).parse(fs.readFileSync(entry, 'utf8'));
    assert.deepEqual(disk.constraints, ['shared constraint']);
    assert.deepEqual(disk.metadata?.vendor, { version: 2 });
    assert.ok(disk.children.some(ref => ref.id === child.id));
    assert.match(disk.body, /Edited introduction/);
    assert.strictEqual(await service.get(destination), child);
    assert.equal(fs.readFileSync(unrelated.path, 'utf8'), bytes);
    assert.equal(unrelated.body, 'Unsaved unrelated\n');
  });
}
test('query execution reruns callbacks and observes shared edits without caching results', async t => {
  const { root, entry, service } = fixture(t);
  let calls = 0;
  const query = service.query(root).filter(n => { calls++; return n.description === 'selected'; });
  assert.deepEqual(await query.value(), []);
  const node = (await service.get(entry))!;
  node.description = 'selected';
  assert.deepEqual(await query.value(), [node]);
  assert.equal(calls, 2);
});
for (const upgrade of ['get', 'list'] as const) {
  test(`query to ${upgrade} retains identity and unsaved body, captures resources only once`, async t => {
    const { root, entry, service } = fixture(t);
    const file = path.join(root, 'child/index.md');
    fs.mkdirSync(path.dirname(file)); fs.writeFileSync(file, 'Original\n');
    const parent = new InternalNode(entry).parse(fs.readFileSync(entry, 'utf8'));
    parent.addChild('local', { id: file }); fs.writeFileSync(entry, parent.serialize());
    const node = (await service.query(root).find(n => n.path === file).value())!;
    node.body = 'Pending\n';
    const upgraded = upgrade === 'get' ? await service.get(file) : (await service.list(root)).find(n => n.path === file);
    assert.strictEqual(upgraded, node); assert.equal(node.body, 'Pending\n');
    fs.writeFileSync(path.join(root, 'child/attachment'), 'late');
    assert.strictEqual(await service.get(file), node);
    await assert.rejects(service.move(node, path.join(root, 'moved/index.md')), /resources changed/i);
    assert.equal(node.body, 'Pending\n');
  });
}
for (const drift of ['content', 'identity', 'other service'] as const) {
  test(`${drift} drift cannot advance a cached entry snapshot`, async t => {
    const { root, service } = fixture(t);
    const node = await service.create(new LeafNode(path.join(root, 'child/index.md')), { body: 'Original\n' });
    node.body = 'Pending\n';
    if (drift === 'content') fs.writeFileSync(node.path, 'External\n');
    if (drift === 'identity') {
      fs.renameSync(node.path, node.path + '.old'); fs.writeFileSync(node.path, 'Original\n');
    }
    if (drift === 'other service') {
      const other = new NodeService({ managedRoot: root });
      await other.update((await other.get(node.path))!, { body: 'External\n' });
    }
    assert.strictEqual(await service.get(node.path), node);
    await assert.rejects(service.update(node, {}), /changed/i);
    await assert.rejects(service.update(node, {}), /changed/i);
    assert.equal(node.body, 'Pending\n');
    assert.equal((await new NodeService({ managedRoot: root }).get(node.path))!.body, drift === 'identity' ? 'Original\n' : 'External\n');
  });
}
test('entry drift during query resource upgrade rejects without dropping user edits', async t => {
  const { root, service } = fixture(t);
  const file = path.join(root, 'child/AGENTS.md');
  fs.mkdirSync(path.dirname(file)); fs.writeFileSync(file, new InternalNode(file).serialize());
  const node = (await service.query(path.dirname(file)).value())[0]!;
  node.body = 'Pending\n'; fs.writeFileSync(file, 'External\n');
  await assert.rejects(service.get(file), /changed/i);
  await assert.rejects(service.list(path.dirname(file)), /changed/i);
  assert.equal(node.body, 'Pending\n');
});
test('co-located harness stays distinct and destroy invalidates both identities before recreation', async t => {
  const { root, entry, service } = fixture(t);
  const leaf = await service.create(new LeafNode(path.join(root, 'child/index.md')), { body: 'Leaf\n' });
  const harness = await service.create(new InternalNode(path.join(root, 'child/AGENTS.md')), { body: 'Harness\n' });
  assert.notStrictEqual(leaf, harness); assert.equal(leaf.harness?.id, harness.path);
  const parent = (await service.get(entry, InternalNode))!; parent.description = 'Pending parent';
  await service.destroy(leaf);
  assert.equal(parent.children.length, 0);
  assert.match(fs.readFileSync(entry, 'utf8'), /Pending parent/);
  await assert.rejects(service.update(leaf, {}), /snapshot/);
  await assert.rejects(service.update(harness, {}), /snapshot/);
  const fresh = await service.create(new LeafNode(leaf.path), { body: 'New\n' });
  assert.notStrictEqual(fresh, leaf); assert.strictEqual(await service.get(fresh.path), fresh);
});
test('move saves affected parents, loaded descendants and referrers but leaves unrelated edits pending', async t => {
  const { root, entry, service } = fixture(t);
  const from = await service.create(new InternalNode(path.join(root, 'from/AGENTS.md')), { body: 'From\n' });
  const to = await service.create(new InternalNode(path.join(root, 'to/AGENTS.md')), { body: 'To\n' });
  const branch = await service.create(new InternalNode(path.join(root, 'from/branch/AGENTS.md')), { body: 'Branch\n' });
  const child = await service.create(new LeafNode(path.join(root, 'from/branch/child/index.md')), { body: 'Child\n' });
  const ref = await service.create(new LeafNode(path.join(root, 'ref/index.md')), { body: '[link](../from/branch/child/index.md?q=1#part)\n' });
  const unrelated = await service.create(new LeafNode(path.join(root, 'other/index.md')), { body: 'Untouched\n' });
  // Capture attachments in a fresh service before moving a directory unit.
  fs.writeFileSync(path.join(child.directoryPath, 'run.log'), 'run');
  const moving = new NodeService({ managedRoot: root });
  const nodes = await moving.list(root, { includeDescendants: true });
  const at = (p: string) => nodes.find(n => n.path === p)!;
  const movedBranch = at(branch.path), movedChild = at(child.path), a = at(from.path), b = at(to.path), r = at(ref.path), u = at(unrelated.path);
  for (const n of [movedBranch, movedChild, a, b, r, u]) n.description = 'pending';
  const unrelatedBytes = fs.readFileSync(u.path, 'utf8'), oldChild = movedChild.path, oldBranch = movedBranch.path;
  await moving.move(movedBranch, path.join(root, 'to/branch/AGENTS.md'));
  for (const n of [movedBranch, movedChild, a, b, r]) {
    assert.match(fs.readFileSync(n.path, 'utf8'), /pending/);
    assert.strictEqual(await moving.get(n.path), n);
  }
  assert.equal(await moving.get(oldChild), undefined); assert.equal(await moving.get(oldBranch), undefined);
  assert.match(fs.readFileSync(r.path, 'utf8'), /to\/branch\/child\/index.md\?q=1#part/);
  assert.equal(fs.readFileSync(path.join(movedChild.directoryPath, 'run.log'), 'utf8'), 'run');
  assert.equal(fs.readFileSync(u.path, 'utf8'), unrelatedBytes); assert.equal(u.description, 'pending');
  assert.ok(fs.existsSync(entry));
});
test('later readonly discovery restricts the original writable instance', async t => {
  const { root, entry } = fixture(t);
  const file = path.join(root, 'child/index.md');
  fs.mkdirSync(path.dirname(file)); fs.writeFileSync(file, 'Child\n');
  const parent = new InternalNode(entry).parse(fs.readFileSync(entry, 'utf8'));
  parent.addChild('local', { id: file }); fs.writeFileSync(entry, parent.serialize());
  const service = new NodeService({ managedRoot: root, readOnlyReference: () => true });
  const node = (await service.get(file))!;
  node.description = 'Pending';
  assert.strictEqual((await service.query(root).value())[1], node);
  await assert.rejects(service.update(node, {}), /read.only/i);
  assert.equal(node.description, 'Pending'); assert.equal(fs.readFileSync(file, 'utf8'), 'Child\n');
});
for (const failure of ['validation', 'policy'] as const) {
  test(`${failure} failure preserves original parent edits without adding a child`, async t => {
    const { root, entry } = fixture(t);
    const service = new NodeService({ managedRoot: root, assertWrite: () => { if (failure === 'policy') throw new Error('Denied'); } });
    const parent = (await service.get(entry, InternalNode))!;
    parent.setConstraints(['Pending']);
    if (failure === 'validation') parent.addChild('local', { id: entry });
    const before = fs.readFileSync(entry, 'utf8'), current = parent.serialize();
    const child = new LeafNode(path.join(root, 'child/index.md'));
    await assert.rejects(service.create(child, { body: 'Child\n' }), failure === 'policy' ? /Denied/ : /cycle/i);
    assert.equal(parent.serialize(), current); assert.equal(fs.readFileSync(entry, 'utf8'), before);
    assert.equal(fs.existsSync(child.path), false);
    await assert.rejects(service.update(child, {}), /snapshot/);
  });
}
test('an already registered missing child does not flush its dirty parent during create', async t => {
  const { root, entry, service } = fixture(t);
  const file = path.join(root, 'child/index.md');
  const document = new InternalNode(entry).parse(fs.readFileSync(entry, 'utf8'));
  document.addChild('local', { id: file }); fs.writeFileSync(entry, document.serialize());
  const parent = (await service.get(entry, InternalNode))!; parent.description = 'Pending';
  const before = fs.readFileSync(entry, 'utf8');
  await service.create(new LeafNode(file), { body: 'Child\n' });
  assert.equal(fs.readFileSync(entry, 'utf8'), before); assert.equal(parent.description, 'Pending');
});
test('custom model selection and reference selection retain a single compatible instance', async t => {
  const { root, entry } = fixture(t);
  class CustomLeaf extends LeafNode {}
  const file = path.join(root, 'child/index.md');
  fs.mkdirSync(path.dirname(file)); fs.writeFileSync(file, 'Child\n');
  const parent = new InternalNode(entry).parse(fs.readFileSync(entry, 'utf8'));
  parent.addChild('local', { id: file }); fs.writeFileSync(entry, parent.serialize());
  for (const options of [{ models: { leaf: CustomLeaf } }, { modelForReference: () => CustomLeaf }]) {
    const service = new NodeService({ managedRoot: root, ...options });
    const node = (await service.query(root).value())[1]!;
    assert.ok(node instanceof CustomLeaf);
    assert.strictEqual(await service.get(file), node);
    assert.strictEqual(await service.get(file, BaseNode), node);
    assert.strictEqual(await service.get(file, LeafNode), node);
    await assert.rejects(service.get(file, InternalNode), /model/i);
  }
});
test('import rejects a cached destination identity before recreating its removed directory', async t => {
  const { root, service } = fixture(t);
  const destination = path.join(root, 'child/index.md');
  const stale = await service.create(new LeafNode(destination), { body: 'Original\n' });
  stale.description = 'Pending';
  fs.rmSync(path.dirname(destination), { recursive: true });
  const external = fs.mkdtempSync(path.join(fs.realpathSync(tmpdir()), 'import-conflict-'));
  t.after(() => fs.rmSync(external, { recursive: true, force: true }));
  fs.writeFileSync(path.join(external, 'index.md'), 'Imported\n');
  await assert.rejects(service.import(path.join(external, 'index.md'), destination), /managed|exists/i);
  assert.equal(fs.existsSync(destination), false);
  assert.equal(stale.body, 'Original\n');
  assert.equal(stale.description, 'Pending');
  assert.strictEqual(await service.get(destination), stale);
});
test('first typed leaf load selects its constructor, later requests constrain that shared instance', async t => {
  const { root, service } = fixture(t);
  class SelectedLeaf extends LeafNode {}
  class OtherLeaf extends LeafNode {}
  const file = path.join(root, 'child/index.md');
  fs.mkdirSync(path.dirname(file)); fs.writeFileSync(file, 'Child\n');
  const selected = (await service.get(file, SelectedLeaf))!;
  assert.ok(selected instanceof SelectedLeaf);
  selected.description = 'Pending';
  assert.strictEqual(await service.get(file, BaseNode), selected);
  assert.strictEqual(await service.get(file), selected);
  await assert.rejects(service.get(file, OtherLeaf), /model/i);
  assert.equal(selected.description, 'Pending');
  await service.update(selected, {});
  assert.match(fs.readFileSync(file, 'utf8'), /Pending/);
});
test('typed query skipping a cached leaf still propagates readonly discovery', async t => {
  const { root, entry } = fixture(t);
  const file = path.join(root, 'child/index.md');
  fs.mkdirSync(path.dirname(file)); fs.writeFileSync(file, 'Child\n');
  const parent = new InternalNode(entry).parse(fs.readFileSync(entry, 'utf8'));
  parent.addChild('local', { id: file }); fs.writeFileSync(entry, parent.serialize());
  const service = new NodeService({ managedRoot: root, readOnlyReference: () => true });
  const child = (await service.get(file))!;
  child.description = 'Pending';
  assert.deepEqual(await service.query(root, { types: ['task'] }).value(), []);
  assert.strictEqual(await service.get(file), child);
  await assert.rejects(service.update(child, {}), /read.only/i);
  assert.equal(child.description, 'Pending');
  assert.equal(fs.readFileSync(file, 'utf8'), 'Child\n');
});
test('AGENTS create rejects incompatible constructors before IO and keeps Internal identity', async t => {
  const { root, service } = fixture(t);
  const file = path.join(root, 'scope/AGENTS.md');
  const incompatible = new BaseNode(file);
  incompatible.description = 'Pending';
  await assert.rejects(service.create(incompatible, { body: '# Scope\n' }), /InternalNode|model/i);
  assert.equal(fs.existsSync(path.dirname(file)), false);
  assert.equal(incompatible.description, 'Pending');
  assert.equal(await service.get(file), undefined);
  class CustomInternal extends InternalNode {}
  const node = new CustomInternal(file);
  assert.strictEqual(await service.create(node, { body: '# Scope\n' }), node);
  assert.strictEqual(await service.get(file, InternalNode), node);
  assert.strictEqual(await service.get(file, BaseNode), node);
  assert.strictEqual((await service.query(path.dirname(file)).value())[0], node);
  const child = await service.create(new LeafNode(path.join(root, 'scope/child/index.md')), { body: 'Child\n' });
  assert.equal(node.children[0]?.id, child.id);
  assert.match(fs.readFileSync(file, 'utf8'), /child\/index.md/);
});
