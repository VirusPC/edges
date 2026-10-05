import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {run} from '../../src/program.js';
import {taskBoardLocation} from '../../src/services/tasks/paths.js';

test('root and child scopes default to their own maintenance board for list and writes',async t=>{
 const root=await mkdtemp(path.join(tmpdir(),'task-default-purpose-'));
 t.after(()=>rm(root,{recursive:true,force:true}));
 const child=path.join(root,'projects/demo');await mkdir(child,{recursive:true});
 for(const scope of [root,child]){
  await writeFile(path.join(scope,'AGENTS.md'),'# Scope\n');
  const call=(args:string[])=>run(['--scope',scope,'tasks',...args],{env:{}});
  for(const purpose of ['domain','maintenance']){
   const created=await call(['--purpose',purpose,'create','--title',purpose]);assert.equal(created.exitCode,0,created.stdout);
  }
  const listed=await call(['list']);assert.equal(listed.exitCode,0,listed.stdout);
  assert.deepEqual(JSON.parse(listed.stdout).tasks.map((task:any)=>task.title),['maintenance']);
  const created=await call(['create','--title','Default write']);assert.equal(created.exitCode,0,created.stdout);
  const task=JSON.parse(created.stdout);assert.match(task.path,/^\.harness\/tasks\//);
  assert.equal((await call(['get',task.stem])).exitCode,0);
  assert.equal((await call(['status',task.stem,'done'])).exitCode,0);
  const domain=await call(['--purpose','domain','list']);
  assert.deepEqual(JSON.parse(domain.stdout).tasks.map((task:any)=>task.title),['domain']);
  assert.equal(taskBoardLocation(scope).purpose,'maintenance');
 }
});
