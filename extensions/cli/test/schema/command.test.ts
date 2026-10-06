import assert from 'node:assert/strict';
import test from 'node:test';
import { run } from '../../src/program.js';

test('schema list/get emit pure JSON without resolving scope', async () => {
  const input = { env: { EDGES_SCOPE: '/does-not-exist' }, stdinIsTTY: true };
  const listed = await run(['schema', 'list'], input);
  assert.equal(listed.exitCode, 0);
  assert.equal(listed.stderr, '');
  assert.deepEqual(JSON.parse(listed.stdout).map((entry: {key: string}) => entry.key), ['task-doc/v1']);
  const got = await run(['--scope', '/does-not-exist', 'schema', 'get', 'task-doc/v1'], input);
  assert.equal(got.exitCode, 0);
  assert.equal(got.stderr, '');
  assert.equal(JSON.parse(got.stdout).$id, 'edges.task-doc/v1');
});

test('schema invalid keys and arguments write only stderr', async () => {
  for (const argv of [['schema'], ['schema','get'], ['schema','get','../other'], ['schema','list','--from','-'], ['schema','get','task-doc/v1','extra']]) {
    const result = await run(argv, { env: {}, stdinIsTTY: true });
    assert.notEqual(result.exitCode, 0, argv.join(' '));
    assert.equal(result.stdout, '');
    assert.ok(result.stderr.length > 0);
  }
});

test('schema process never waits for open stdin, including malformed --from -', async () => {
  const { spawn } = await import('node:child_process');
  const { mkdtemp, readdir, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { default: path } = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const directory = await mkdtemp(path.join(tmpdir(), 'edges-schema-command-'));
  try {
    for (const argv of [['schema','list'], ['schema','get','task-doc/v1'], ['--scope','/invalid','schema','list','--from','-']]) {
      const result = await new Promise<{code: number | null; stdout: string; stderr: string}>((resolve, reject) => {
        const child = spawn(process.execPath, ['--import', fileURLToPath(import.meta.resolve('tsx')), fileURLToPath(new URL('../../src/index.ts', import.meta.url)), ...argv], {cwd: directory, stdio: 'pipe'});
        let stdout = '', stderr = '';
        child.stdout.on('data', value => { stdout += value; });
        child.stderr.on('data', value => { stderr += value; });
        const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error('schema waited for stdin')); }, 5000);
        child.on('error', error => {clearTimeout(timer); reject(error);});
        child.on('close', code => { clearTimeout(timer); resolve({code, stdout, stderr}); });
        // Deliberately keep the writable stdin stream open until process exit.
      });
      if (argv.includes('--from')) { assert.notEqual(result.code, 0); assert.equal(result.stdout, ''); assert.match(result.stderr, /unknown option/); }
      else { assert.equal(result.code, 0, result.stderr); assert.equal(result.stderr, ''); JSON.parse(result.stdout); }
    }
    assert.deepEqual(await readdir(directory), []);
  } finally { await rm(directory, {recursive: true, force: true}); }
});
