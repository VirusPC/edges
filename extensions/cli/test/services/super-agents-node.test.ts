import assert from "node:assert/strict";
import { test } from "node:test";
import * as fs from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { NodeService } from "../../src/services/node/node-service.js";
import { AgentsNode } from "../../src/domain/models/index.js";
import { SuperAgentsNode } from "../../src/domain/models/internal/super-agents-node.js";

function fixture(withAgents = false) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(tmpdir(), "edges-super-")));
  fs.mkdirSync(path.join(root, ".git"));
  fs.mkdirSync(path.join(root, "tasks"));
  fs.writeFileSync(path.join(root, "tasks", "AGENTS.md"), "# Tasks\n");
  fs.writeFileSync(
    path.join(root, "README.md"),
    "# Edges\n\n<!-- project-entries-local:start -->\n## 本层内容\n\n- [领域任务](tasks/AGENTS.md) — 看板。\n<!-- project-entries-local:end -->\n",
  );
  if (withAgents) fs.writeFileSync(path.join(root, "AGENTS.md"), "# Root\n");
  return root;
}
const snapshot = (dir: string) =>
  fs.readdirSync(dir, { recursive: true }).map(String).sort();

test("scope without AGENTS fails without --super", async () => {
  const root = fixture();
  const service = new NodeService({ managedRoot: root });
  await assert.rejects(
    () => service.list(root),
    /--super/,
  );
});

test("with --super roots at SuperAgentsNode over root README", async () => {
  const root = fixture();
  const before = snapshot(root);
  const service = new NodeService({ managedRoot: root });
  const nodes = await service.list(root, { super: true });
  assert.ok(nodes[0] instanceof SuperAgentsNode);
  assert.ok(nodes[0] instanceof AgentsNode);
  assert.deepEqual(
    nodes[0]!.children.map((child) => child.id),
    [path.join(root, "README.md")],
  );
  const paths = nodes.map((node) => node.path);
  assert.ok(paths.includes(path.join(root, "README.md")));
  assert.ok(paths.includes(path.join(root, "tasks", "AGENTS.md")));
  assert.deepEqual(snapshot(root), before);
  assert.equal(fs.existsSync(nodes[0]!.path), false);
});

test("a real AGENTS stays the default entry; --super still builds the super node", async () => {
  const root = fixture(true);
  const service = new NodeService({ managedRoot: root });
  const plain = await service.list(root);
  assert.ok(!plain.some((node) => node instanceof SuperAgentsNode));
  assert.equal(plain[0]!.path, path.join(root, "AGENTS.md"));
  const superNodes = await service.list(root, { super: true });
  assert.ok(superNodes[0] instanceof SuperAgentsNode);
});

test("--super without a root README fails clearly", async () => {
  const root = fixture();
  fs.rmSync(path.join(root, "README.md"));
  const service = new NodeService({ managedRoot: root });
  await assert.rejects(() => service.list(root, { super: true }), /README\.md/);
});
