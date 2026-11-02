import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, mkdir, readFile, writeFile, rm, realpath, access, readdir } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { run } from "../../src/program.js";
import { NodeService } from "../../src/services/node/node-service.js";
import { TaskNode, ReadmeNode } from "../../src/domain/models/index.js";
import { listRepositoryGroupedByProject } from "../../src/services/tasks/grouped.js";
import { planTaskIndexes } from "../../src/services/tasks/index-migration.js";

async function fixture(t: { after(fn: () => Promise<void>): void }) {
  const scope = await realpath(await mkdtemp(path.join(tmpdir(),"recursive-tasks-")));
  t.after(() => rm(scope,{recursive:true,force:true}));
  await writeFile(path.join(scope,"AGENTS.md"),"# Scope\n");
  const call = (args:string[], project?:string) => run(["--scope",scope,...(project?["--project",project]:[]),...args],{env:{}});
  const ok = async (args:string[],project?:string) => {
    const result = await call(args,project);
    assert.equal(result.exitCode,0,result.stdout+result.stderr);
    return JSON.parse(result.stdout);
  };
  const project = async (title:string,parent?:string) => {
    const result = await ok(["projects","create","--title",title],parent);
    return path.relative(path.join(scope,".edges/projects"),path.dirname(path.join(scope,result.path))).split(path.sep).join("/");
  };
  return {scope,call,ok,project};
}

test("root, Project and nested Project tasks use direct boards and real owner identities",async t=>{
  const {scope,ok,project}=await fixture(t);
  const p=await project("Parent"),q=await project("Child",p);
  const records=[];
  for(const selected of [undefined,p,q]) {
    const created=await ok(["tasks","create","--title","Same","--status","todo"],selected);
    records.push(created);
    const prefix=selected?`.edges/projects/${selected}/tasks/todo/` : ".edges/tasks/todo/";
    assert.ok(created.path.startsWith(prefix),created.path);
    assert.doesNotMatch(await readFile(path.join(scope,created.path),"utf8"),/edges-task-project/);
    assert.equal((await ok(["tasks","get",created.stem],selected)).task.path,created.path);
  }
  assert.equal(new Set(records.map(item=>item.stem)).size,1);
  const all=await ok(["tasks","list"]);
  assert.equal(all.tasks.length,3);
  assert.equal(new Set(all.tasks.map((item:any)=>item.path)).size,3);
  const parent=await ok(["tasks","list"],p);
  assert.equal(parent.tasks.length,2);
  assert.ok(parent.tasks.every((item:any)=>item.path.startsWith(`.edges/projects/${p}/`)));
  const nested=await ok(["tasks","list"],q);
  assert.equal(nested.tasks.length,1);
  const plusSuper=await ok(["--super","tasks","list"],q);
  assert.deepEqual(plusSuper.tasks,nested.tasks);
  const grouped=await listRepositoryGroupedByProject(scope);
  assert.equal(grouped.items.length,3);
  assert.equal(new Set(grouped.items.map(item=>item.id)).size,3);
  assert.ok(grouped.groups.some(group=>group.project===q));
  for(const selected of [p,q]) {
    await assert.rejects(access(path.join(scope,".edges/projects",selected,"AGENTS.md")));
    await assert.rejects(access(path.join(scope,".edges/projects",selected,".edges")));
  }
});

test("reassignment moves the full task directory, rewires indexes and returns to default without a layer",async t=>{
  const {scope,ok,project}=await fixture(t);
  const p=await project("Destination");
  const created=await ok(["tasks","create","--title","Move","--status","in_progress","--priority","high"]);
  const original=path.join(scope,created.path);
  const log="Historical log bytes\nunchanged\n";
  await writeFile(path.join(scope,created.sidecarPath),log);
  await writeFile(path.join(path.dirname(original),"attachment.txt"),"resource bytes");
  const moved=await ok(["tasks","update",created.stem,"--to-project",p]);
  await assert.rejects(access(original));
  assert.equal(moved.project,p);
  assert.equal(await readFile(path.join(path.dirname(path.join(scope,moved.path)),"attachment.txt"),"utf8"),"resource bytes");
  assert.equal(await readFile(path.join(path.dirname(path.join(scope,moved.path)),`.${created.stem}.log.md`),"utf8"),log);
  const service=new NodeService({managedRoot:scope});
  const source=await service.get(path.join(scope,".edges/tasks/README.md"),ReadmeNode);
  assert.ok(!source?.children.some(child=>child.id===original));
  assert.equal((await ok(["tasks","get",created.stem],p)).task.status,"in_progress");
  const back=await ok(["tasks","update",created.stem,"--to-default"],p);
  assert.equal(back.path,created.path);
  assert.equal(back.priority,"high");
  assert.equal(await readFile(path.join(scope,created.sidecarPath),"utf8"),log);
  assert.ok(!(await readdir(path.join(scope,".edges/tasks"))).includes("_default"));
});

test("reassignment rejects existing task stems and invalid destinations without changing source",async t=>{
  const {scope,ok,call,project}=await fixture(t);
  const p=await project("Existing");
  const first=await ok(["tasks","create","--title","Same"]);
  await ok(["tasks","create","--title","Same","--status","done"],p);
  const before=await readFile(path.join(scope,first.path),"utf8");
  for(const flags of [["--to-project",p],["--to-project","../escape"],["--to-project","missing"],["--to-project",p,"--to-default"]]) {
    const result=await call(["tasks","update",first.stem,...flags]);
    assert.notEqual(result.exitCode,0,result.stdout);
    assert.equal(await readFile(path.join(scope,first.path),"utf8"),before);
  }
  const scoped=await call(["tasks","get",first.path],p);
  assert.notEqual(scoped.exitCode,0);
});

test("ambiguous stems within a board require explicit paths",async t=>{
  const {scope,ok,call}=await fixture(t);
  const first=await ok(["tasks","create","--title","Ambiguous","--status","todo"]);
  const source=await readFile(path.join(scope,first.path),"utf8");
  const other=path.join(scope,first.path.replace("/todo/","/done/"));
  const service=new NodeService({managedRoot:scope});
  await service.create(new TaskNode(other),{body:"Other",name:"Other",status:"done",title:"Other"});
  const ambiguous=await call(["tasks","get",first.stem]);
  assert.equal(JSON.parse(ambiguous.stdout).errorCode,"AMBIGUOUS_TASK");
  assert.equal((await ok(["tasks","get",first.path])).task.path,first.path);
  assert.equal(await readFile(path.join(scope,first.path),"utf8"),source);
});

test("ordinary task operations refuse legacy groups and retired index migration never writes",async t=>{
  const {scope,call}=await fixture(t);
  const group=path.join(scope,".edges/tasks/_default/todo");
  await mkdir(group,{recursive:true});
  for(const args of [["tasks","create","--title","New"],["tasks","get","missing"]]) {
    const result=await call(args);
    assert.notEqual(result.exitCode,0);
    assert.match(result.stdout,/requires migration/);
  }
  await assert.rejects(planTaskIndexes(scope),/retired/);
  assert.deepEqual(await readdir(group),[]);
});
