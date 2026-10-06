import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { discoverDirectories, findAncestor, isWithinPath, canonicalPath, firstSymlink } from '../../src/utils/filesystem.js';
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

test('path primitives distinguish containment and existing link ancestors', t => {
  const root = realpathSync(mkdtempSync(path.join(tmpdir(), 'path-primitives-')));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(path.join(root, 'real'));
  symlinkSync(path.join(root, 'real'), path.join(root, 'alias'));
  assert.equal(isWithinPath(path.join(root, '..draft/index.md'), root), true);
  assert.equal(isWithinPath(`${root}-other/index.md`, root), false);
  assert.equal(isWithinPath(root, root), true);
  assert.equal(canonicalPath(path.join(root, 'alias/new/index.md')), path.join(root, 'real/new/index.md'));
  assert.equal(firstSymlink(path.join(root, 'alias/new/index.md'), root), path.join(root, 'alias'));
  assert.equal(firstSymlink(path.join(root, 'real/new/index.md'), root), undefined);
  assert.throws(() => firstSymlink(root, path.join(root, 'real')));
  symlinkSync('loop', path.join(root, 'loop'));
  assert.throws(() => canonicalPath(path.join(root, 'loop')));
});
