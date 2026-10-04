import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, symlinkSync, mkdirSync, renameSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { readNode, saveNode } from '../src/index.js';

test('repository composes model, source and location; save reloads through the codec', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'edges-codec-save-'));
  try {
    const file = path.join(dir, 'AGENTS.md');
    writeFileSync(file, '# Manual\n\n## 本层记忆\n\n- [Tasks](tasks/AGENTS.md)\n');
    const loaded = readNode(dir)!;
    assert.equal(loaded.location.entryPath, file);
    assert.equal(loaded.model.memory[0].content[0].target, 'tasks/AGENTS.md');
    const model = structuredClone(loaded.model);
    model.constraints.push({ content: [{ kind: 'text', value: 'Preserve private material.' }] });
    const saved = saveNode(loaded, model);
    assert.deepEqual(saved.model, model);
    assert.equal(saved.source, readFileSync(file, 'utf8'));
    assert.ok(saved.source.startsWith('# Manual\n'));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('stale snapshots and substituted AGENTS symlinks cannot overwrite newer material', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'edges-codec-stale-'));
  try {
    const file = path.join(dir, 'AGENTS.md');
    writeFileSync(file, '# Original\n');
    const loaded = readNode(dir)!;
    writeFileSync(file, '# Human edit\n');
    assert.throws(() => saveNode(loaded, loaded.model), /changed|stale/i);
    assert.equal(readFileSync(file, 'utf8'), '# Human edit\n');
    rmSync(file);
    const other = path.join(dir, 'other.md');
    writeFileSync(other, '# Original\n');
    symlinkSync(other, file);
    assert.throws(() => saveNode(loaded, loaded.model), /regular|symlink/i);
    assert.equal(readFileSync(other, 'utf8'), '# Original\n');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('substituting an ancestor directory with a symlink cannot redirect a save', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'edges-codec-ancestor-'));
  try {
    const directory = path.join(root, 'owner/child');
    const external = path.join(root, 'external/child');
    for (const dir of [directory, external]) {
      mkdirSync(dir, { recursive: true });
      writeFileSync(path.join(dir, 'AGENTS.md'), '# Identical source\n');
    }
    const original = readNode(directory)!;
    renameSync(path.join(root, 'owner'), path.join(root, 'previous-owner'));
    symlinkSync(path.join(root, 'external'), path.join(root, 'owner'));
    original.model.constraints.push({ content: [{ kind: 'text', value: 'New rule' }] });
    assert.throws(() => saveNode(original, original.model), /location|identity|changed/i);
    assert.equal(readFileSync(path.join(external, 'AGENTS.md'), 'utf8'), '# Identical source\n');
  } finally { rmSync(root, { recursive: true, force: true }); }
});
