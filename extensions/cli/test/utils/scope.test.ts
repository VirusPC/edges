import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { resolveScope, gitRoot, portableScope } from '../../src/services/scope.js';
import { TasksError } from '../../src/models/tasks/types.js';

test('missing scope remains a validation error without belonging to Tasks', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'edges-scope-adapter-'));
  try {
    assert.throws(() => resolveScope({}, root), (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.equal((error as Error & { errorCode: string }).errorCode, 'VALIDATION_ERROR');
      assert.equal(error instanceof TasksError, false);
      return true;
    });
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('CLI owns explicit/env precedence and Git fallback independently of node traversal', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'edges-scope-policy-'));
  try {
    mkdirSync(path.join(root, '.git'));
    const child = path.join(root, 'project');
    mkdirSync(child);
    writeFileSync(path.join(child, 'AGENTS.md'), '<!-- project-memory:start -->\n<!-- project-memory-local:start -->');
    assert.equal(resolveScope({ EDGES_SCOPE: 'env', EDGES_REPO: root }, child, 'explicit'), path.join(child, 'explicit'));
    assert.equal(resolveScope({ EDGES_SCOPE: 'env', EDGES_REPO: root }, child), path.join(child, 'env'));
    assert.equal(resolveScope({ EDGES_SCOPE: '  ', EDGES_REPO: root }, child), root);
    assert.equal(resolveScope({}, child), child);
    assert.equal(gitRoot(child), root);
    assert.equal(portableScope(child), 'project');
    const nested = path.join(child, 'nested-repo');
    mkdirSync(nested);
    writeFileSync(path.join(nested, '.git'), 'gitdir: elsewhere');
    assert.equal(resolveScope({}, nested), nested);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
