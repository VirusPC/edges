import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, symlinkSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { discoverDirectories, findAncestor } from '../../src/utils/filesystem.js';
import { walkTree } from '../../src/utils/tree.js';

test('physical inventory respects pruning and excludes linked directories', t => {
  const root = mkdtempSync(path.join(tmpdir(), 'inventory-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(path.join(root, 'nested/child'), { recursive: true });
  mkdirSync(path.join(root, 'excluded/hidden'), { recursive: true });
  symlinkSync(path.join(root, 'nested'), path.join(root, 'alias'));
  assert.deepEqual(discoverDirectories(root, dir => path.basename(dir) !== 'excluded').map(dir => path.relative(root, dir)), ['', 'nested', 'nested/child']);
  assert.equal(findAncestor(path.join(root, 'nested/child'), dir => dir === root), root);
  assert.equal(findAncestor(path.join(root, 'nested/child'), dir => dir === root, dir => path.basename(dir) === 'nested'), undefined);
});
test('generic traversal terminates cycles and does not overflow on deep inputs', () => {
  assert.deepEqual(walkTree(0, n => [(n + 1) % 3], String), [0, 1, 2]);
  assert.equal(walkTree(0, n => n < 20000 ? [n + 1] : [], String).length, 20001);
});
