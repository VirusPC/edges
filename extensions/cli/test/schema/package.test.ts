import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtemp, readdir, readFile, rename, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

async function files(directory: string): Promise<string[]> {
  const result: string[] = [];
  for (const entry of await readdir(directory, {withFileTypes:true})) {
    if (entry.isDirectory()) result.push(...(await files(path.join(directory,entry.name))).map(file => `${entry.name}/${file}`));
    else result.push(entry.name);
  }
  return result;
}

test('packed CLI works outside repo with production dependencies and fails clearly for missing artifacts', { timeout: 180000 }, async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'edges-schema-package-'));
  try {
    execFileSync('pnpm', ['pack','--pack-destination',directory], {cwd: new URL('../../', import.meta.url), stdio:'pipe'});
    const archive = (await readdir(directory)).find(file => file.endsWith('.tgz'))!;
    const installation = path.join(directory,'installation');
    await mkdir(installation);
    execFileSync('npm',['install','--prefix',installation,'--omit=dev','--ignore-scripts','--no-audit','--no-fund',path.join(directory,archive)], {stdio:'pipe'});
    const packageDir = path.join(installation,'node_modules/edges-cli');
    const inventory = await files(packageDir);
    assert.equal(inventory.some(file => file.startsWith('src/') || file.startsWith('scripts/') || (file.endsWith('.ts') && !file.endsWith('.d.ts'))),false);
    assert.ok(inventory.includes('dist/schemas/task-doc.v1.json'));
    assert.ok(inventory.includes('dist/schemas/manifest.json'));
    assert.ok(inventory.includes('dist/commands/tasks/project/assets/review-page/review.js'));
    assert.ok(inventory.some(file => file.startsWith('dist/assets/memory/templates/')));
    const installed = await readdir(path.join(installation,'node_modules'));
    assert.ok(installed.includes('ajv') && installed.includes('ajv-formats'));
    assert.equal(installed.includes('ts-json-schema-generator') || installed.includes('tsx') || installed.includes('tasks-review-app'), false);
    const invoke = (...argv: string[]) => spawnSync(process.execPath,[path.join(packageDir,'dist/index.js'),...argv], {cwd: directory, encoding:'utf8', env:{...process.env, EDGES_SCOPE:'/invalid'}});
    const list = invoke('schema','list');
    assert.equal(list.status,0,list.stderr); assert.equal(list.stderr,'');
    const entries = JSON.parse(list.stdout);
    assert.deepEqual(Object.keys(entries[0]).sort(), ['description','id','key','title']);
    const get = invoke('schema','get','task-doc/v1');
    assert.equal(get.status,0,get.stderr); assert.equal(get.stderr,''); assert.equal(JSON.parse(get.stdout).$id,'edges.task-doc/v1');
    const unknown = invoke('schema','get','../other');
    assert.notEqual(unknown.status,0); assert.equal(unknown.stdout,''); assert.match(unknown.stderr,/Unknown schema key/);
    // Exercise the compiled JSON boundary as well as the command tree without development dependencies.
    const validator = spawnSync(process.execPath,['--input-type=module','-e',`import {validateTaskDocInput} from ${JSON.stringify(new URL('file://' + path.join(packageDir,'dist/services/tasks/task-doc.js')).href)}; const doc={name:'',description:'',metadata:{custom:{nested:true}},body:''}; if(validateTaskDocInput(doc)!==doc)throw Error('changed input'); try {validateTaskDocInput({...doc,extra:true}); throw Error('accepted extra')} catch(e) {if(!e.message.includes('doc/extra')) throw e}`], {cwd:directory,encoding:'utf8'});
    assert.equal(validator.status,0,validator.stderr);
    for (const file of ['task-doc.v1.json','manifest.json']) {
      const original = path.join(packageDir,'dist/schemas',file);
      const saved = original + '.saved';
      await rename(original,saved);
      try {
        const missing = invoke('schema','get','task-doc/v1');
        assert.notEqual(missing.status,0); assert.equal(missing.stdout,''); assert.match(missing.stderr,/Rebuild.*build:schemas.*reinstall/);
        assert.equal((await readdir(path.dirname(original))).includes(file),false);
      } finally {await rename(saved,original);}
    }
    const manifest = JSON.parse(await readFile(path.join(packageDir,'dist/schemas/manifest.json'),'utf8'));
    assert.equal(manifest[0].file,'task-doc.v1.json');
  } finally {await rm(directory,{recursive:true,force:true});}
});
