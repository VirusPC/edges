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
  const call=(args:string[])=>run(['--scope',scope,'tasks', "--index-group", "local",...args],{env:{}});
  for(const purpose of ['domain','maintenance']){
   const created=await call(['--purpose',purpose,'create','--title',purpose]);assert.equal(created.exitCode,0,created.stdout);
  }
  const listed=await call(['list']);assert.equal(listed.exitCode,0,listed.stdout);
  assert.deepEqual(JSON.parse(listed.stdout).tasks.map((task:any)=>task.title),['maintenance']);
  const created=await call(['create','--title','Default write']);assert.equal(created.exitCode,0,created.stdout);
  const task=JSON.parse(created.stdout);assert.match(task.path,/^\.harness\/tasks\//);
  assert.equal((await call(['get',task.stem])).exitCode,0);
  assert.equal((await call(['update',task.stem,'--priority','high'])).exitCode,0);
  assert.equal((await call(['status',task.stem,'done'])).exitCode,0);
  assert.equal((await call(['runs',task.stem,'--output','json'])).exitCode,0);
  const project = await call(['project','get','default']); assert.equal(project.exitCode,0,project.stdout);
  assert.match(JSON.parse(project.stdout).path,/^\.harness\/tasks\//);
  const absentRun = await call(['run-messages',task.stem+'--99','--output','json']);
  assert.equal(JSON.parse(absentRun.stdout).errorCode,'RUN_NOT_FOUND');
  const domain=await call(['--purpose','domain','list']);
  assert.deepEqual(JSON.parse(domain.stdout).tasks.map((task:any)=>task.title),['domain']);
  assert.equal(taskBoardLocation(scope).purpose,'maintenance');
 }
});
