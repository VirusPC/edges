import assert from "node:assert/strict";
import { test } from "node:test";
import * as fs from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { NodeService } from "../../src/services/node/node-service.js";
import { BaseNode, InternalNode, LeafNode, ReadmeNode } from "../../src/domain/models/index.js";
import { traverse } from "../../src/domain/operations/traverse.js";
import type { NodeQueryOptions } from "../../src/domain/operations/traverse.js";

const refs = (nodes: BaseNode[]) => nodes.map((n) => ({ id: n.id }));
const agents = (dir: string, local: BaseNode[] = [], descendants: BaseNode[] = []) =>
  new InternalNode(`/r/${dir}/AGENTS.md`).create(
    { localChildren: refs(local), descendantChildren: refs(descendants) },
    { operation: "create" },
  );
const readme = (dir: string, local: BaseNode[] = [], descendants: BaseNode[] = []) =>
  new ReadmeNode(`/r/${dir}/README.md`).create(
    { localChildren: refs(local), descendantChildren: refs(descendants) },
    { operation: "create" },
  );

function graph(nodes: BaseNode[]) {
  const entries = new Map(nodes.map((n) => [n.id, n]));
  const run = async (roots: BaseNode, options: NodeQueryOptions = {}) => {
    const paths: string[] = [];
    for await (const n of traverse(
      roots,
      options,
      (_p, ref) => (entries.has(ref.id) ? ref.id : undefined),
      async (_p, _r, id) => entries.get(id)!,
    ))
      paths.push(n.path);
    return paths;
  };
  return { run };
}

test("traverse defaults to all children", async () => {
  const mem = agents("scope/.harness/memory/projects");
  const nestedAgents = agents("scope/nested");
  const root = agents("scope", [mem], [nestedAgents]);
  const { run } = graph([root, mem, nestedAgents]);
  const paths = await run(root);
  assert.ok(paths.includes(nestedAgents.path));
  assert.ok(paths.includes(mem.path));
});

test("localOnly skips descendant group", async () => {
  const mem = agents("scope/.harness/memory/projects");
  const nestedAgents = agents("scope/nested");
  const root = agents("scope", [mem], [nestedAgents]);
  const { run } = graph([root, mem, nestedAgents]);
  const paths = await run(root, { localOnly: true });
  assert.ok(paths.includes(mem.path));
  assert.ok(!paths.includes(nestedAgents.path));
});

test("includeDescendants:false maps to localOnly", async () => {
  const nestedAgents = agents("scope/nested");
  const root = agents("scope", [], [nestedAgents]);
  const { run } = graph([root, nestedAgents]);
  assert.ok(!(await run(root, { includeDescendants: false })).includes(nestedAgents.path));
  assert.ok((await run(root, { includeDescendants: true })).includes(nestedAgents.path));
});

test("README local/descendants honour localOnly", async () => {
  const tasksReadme = readme("scope/tasks");
  const lowerReadme = readme("scope/lower");
  const scopeReadme = readme("scope", [tasksReadme], [lowerReadme]);
  const root = agents("scope");
  const { run } = graph([root, scopeReadme, tasksReadme, lowerReadme]);
  assert.deepEqual(await run(scopeReadme, { localOnly: true }), [scopeReadme.path, tasksReadme.path]);
});

test("scope AGENTS merges same-dir README composition edges at traverse time", async () => {
  const mem = agents("scope/.harness/memory/projects");
  const tasksReadme = readme("scope/tasks");
  const lowerReadme = readme("scope/lower");
  const scopeAgents = agents("scope", [mem]);
  const scopeReadme = readme("scope", [tasksReadme], [lowerReadme]);
  const { run } = graph([scopeAgents, scopeReadme, mem, tasksReadme, lowerReadme]);

  const paths = await run(scopeAgents);
  assert.deepEqual(paths, [scopeAgents.path, mem.path, scopeReadme.path, tasksReadme.path, lowerReadme.path]);

  for (const ref of [...scopeAgents.localChildren, ...scopeAgents.descendantChildren])
    assert.ok(!ref.id.includes("/tasks/"), "AGENTS fields must not carry README edges");
  assert.ok(!scopeAgents.children.some((c) => c.id === scopeReadme.id));
  for (const ref of scopeReadme.descendantChildren) assert.equal(ref.id.split("/").pop(), "README.md");

  const local = await run(scopeAgents, { localOnly: true });
  assert.ok(local.includes(tasksReadme.path));
  assert.ok(!local.includes(lowerReadme.path));
});

test("missing same-dir README is skipped; non-AGENTS roots get no companion", async () => {
  const item = new LeafNode("/r/scope/item/index.md");
  const scopeAgents = agents("scope", [item]);
  const { run } = graph([scopeAgents, item]);
  assert.deepEqual(await run(scopeAgents), [scopeAgents.path, item.path]);

  const scopeReadme = readme("scope");
  const other = agents("scope");
  assert.deepEqual(await graph([scopeReadme, other]).run(scopeReadme), [scopeReadme.path]);
});

const scopeAgentsMd = `# Scope

<!-- project-harness-constraints:start -->
## 本层硬约束

Keep constraints.
<!-- project-harness-constraints:end -->
<!-- project-harness-local:start -->
## 本层系统维护信息

<!-- project-harness-local:end -->
<!-- project-harness-descendants:start -->
## 下层系统维护信息

<!-- project-harness-descendants:end -->
`;

test("NodeService reaches README composition from scope AGENTS; localOnly narrows", async (t) => {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(tmpdir()), "dual-entry-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (name: string, text: string) => {
    fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true });
    fs.writeFileSync(path.join(root, name), text);
  };
  write("AGENTS.md", scopeAgentsMd);
  write(
    "README.md",
    `# Root\n\n<!-- project-entries-local:start -->\n## 本层内容\n\n- [Tasks](tasks/README.md)\n<!-- project-entries-local:end -->\n\n<!-- project-entries-descendants:start -->\n## 下层内容\n\n- [Lower](lower/README.md)\n<!-- project-entries-descendants:end -->\n`,
  );
  write("tasks/README.md", "# Tasks\n");
  write("lower/README.md", "# Lower\n");
  const service = new NodeService({ managedRoot: root });
  const rel = (nodes: BaseNode[]) => nodes.map((n) => path.relative(root, n.path));
  assert.deepEqual(rel(await service.list(root)), ["AGENTS.md", "README.md", "tasks/README.md", "lower/README.md"]);
  assert.deepEqual(rel(await service.list(root, { localOnly: true })), ["AGENTS.md", "README.md", "tasks/README.md"]);
  const agentsNode = (await service.list(root))[0] as InternalNode;
  assert.equal(agentsNode.children.length, 0);

  fs.rmSync(path.join(root, "README.md"));
  assert.deepEqual(rel(await new NodeService({ managedRoot: root }).list(root)), ["AGENTS.md"]);
});
