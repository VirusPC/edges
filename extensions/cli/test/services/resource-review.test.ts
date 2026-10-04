import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { NodeService } from '../../src/services/node-service.js';
import { TaskNode, NoteNode } from '../../src/models/index.js';
import { moveTaskEntry } from '../../src/services/tasks/write.js';
import { createNodeBoardWriter } from '../../src/services/tasks/board.js';
import { initMemory } from '../../src/services/memory/init.js';
import { addMemoryType } from '../../src/services/memory/add-type.js';
import { run } from '../../src/program.js';
function fixture(t: any) { const root = fs.realpathSync(fs.mkdtempSync(path.join(tmpdir(), 'resource-review-'))); t.after(() => fs.rmSync(root, { recursive: true, force: true })); return root; }
function put(file: string, text: string) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text); }
for (const conflict of ['source', 'destination-identity', 'destination-content'] as const) {
  test(`runlog rollback preserves concurrent ${conflict} changes and reports recoverable original`, async t => {
    const root = fixture(t), source = 'tasks/_default/todo/task.md', destination = 'tasks/_default/done/task.md';
    const sourceLog = 'tasks/_default/todo/.task.log.md', destLog = 'tasks/_default/done/.task.log.md';
    put(path.join(root, source), 'Task'); put(path.join(root, sourceLog), 'Original log'); fs.chmodSync(path.join(root, sourceLog), 0o600); fs.mkdirSync(path.dirname(path.join(root, destLog)), { recursive: true });
    let touched = false;
    const service = new NodeService({ assertWrite: ({ operation }) => {
      if (operation !== 'move' || touched) return; touched = true;
      if (conflict === 'source') put(path.join(root, sourceLog), 'Human log');
      else if (conflict === 'destination-identity') { fs.renameSync(path.join(root, destLog), path.join(root, 'original-log')); put(path.join(root, destLog), 'Original log'); }
      else put(path.join(root, destLog), 'Human log');
      throw new Error('Concurrent policy rejection');
    } });
    const node = (await service.get(path.join(root, source), TaskNode))!;
    await assert.rejects(() => moveTaskEntry(root, service, node, destination, sourceLog, destLog, createNodeBoardWriter(root)), /recover.*runlog|runlog.*recover/i);
    assert.equal(fs.readFileSync(path.join(root, source), 'utf8'), 'Task');
    if (conflict === 'source') assert.equal(fs.readFileSync(path.join(root, sourceLog), 'utf8'), 'Human log');
    else { assert.equal(fs.existsSync(path.join(root, sourceLog)), false); assert.equal(fs.readFileSync(path.join(root, destLog), 'utf8'), conflict === 'destination-content' ? 'Human log' : 'Original log'); }
    const recovery = fs.readdirSync(path.dirname(path.join(root, destLog))).find(name => name.startsWith('.node-recovery-'));
    assert.ok(recovery); const recoveryPath = path.join(path.dirname(path.join(root, destLog)), recovery); assert.equal(fs.readFileSync(recoveryPath, 'utf8'), 'Original log'); assert.equal(fs.statSync(recoveryPath).mode & 0o777, 0o600);
  });
}
test('forward runlog movement never overwrites a target created after its asynchronous preflight', async t => {
  const root = fixture(t), source = 'tasks/_default/todo/task.md', destination = 'tasks/_default/done/task.md'; const sourceLog = 'tasks/_default/todo/.task.log.md', destLog = 'tasks/_default/done/.task.log.md';
  put(path.join(root, source), 'Task'); put(path.join(root, sourceLog), 'Original'); fs.mkdirSync(path.dirname(path.join(root, destLog)), { recursive: true });
  const writer = createNodeBoardWriter(root), exists = writer.exists; writer.exists = async file => { const result = await exists(file); if (file === path.join(root, destLog) && !result) put(file, 'Concurrent destination'); return result; };
  const service = new NodeService(), node = (await service.get(path.join(root, source), TaskNode))!;
  await assert.rejects(() => moveTaskEntry(root, service, node, destination, sourceLog, destLog, writer));
  assert.equal(fs.readFileSync(path.join(root, destLog), 'utf8'), 'Concurrent destination'); assert.equal(fs.readFileSync(path.join(root, sourceLog), 'utf8'), 'Original');
});
test('public managed Skill CLI import preserves executable mode; private resources strip group and other bits', async t => {
  const root = fixture(t); await initMemory({ targetDir: root, skillTypes: ['managed'] }); await addMemoryType({ targetDir: root, name: 'secrets', description: 'Private resource fixtures', gitignore: true });
  const source = path.join(root, 'assets'); put(path.join(source, 'run.sh'), '#!/bin/sh\nexit 0\n'); fs.chmodSync(path.join(source, 'run.sh'), 0o755); put(path.join(source, 'plain.txt'), 'Fixture'); fs.chmodSync(path.join(source, 'plain.txt'), 0o644);
  for (const type of ['managed', 'secrets']) {
    const result = await run(['--scope', root, 'memory', 'remember', '--type', type, '--slug', 'example', '--title', 'Example', '--description', 'Fixture', '--content', 'Body', '--format', 'directory', '--resources', source], { env: {} });
    assert.equal(result.exitCode, 0, result.stdout); const entry = path.join(root, JSON.parse(result.stdout).path), dir = path.dirname(entry);
    assert.equal(fs.statSync(entry).mode & 0o777, 0o600); assert.equal(fs.statSync(path.join(dir, 'run.sh')).mode & 0o777, type === 'managed' ? 0o755 : 0o700); assert.equal(fs.statSync(path.join(dir, 'plain.txt')).mode & 0o777, type === 'managed' ? 0o644 : 0o600);
    if (type === 'secrets') assert.equal(fs.statSync(dir).mode & 0o777, 0o700);
  }
});
test('resourceMode rejects invalid permissions before creating the unit', async t => {
  const root = fixture(t), source = path.join(root, 'assets'); put(path.join(source, 'a'), 'bytes');
  for (const mode of [-1, 0o1000, 1.5, NaN, undefined, null]) {
    const service = new NodeService({ resourceMode: () => mode as number });
    await assert.rejects(() => service.create(new NoteNode(path.join(root, 'unit/index.md')), undefined, { resources: source }), /permission|mode/i); assert.equal(fs.existsSync(path.join(root, 'unit')), false);
  }
});
