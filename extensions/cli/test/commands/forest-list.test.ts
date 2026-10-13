import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  realpathSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { AgentsNode } from "../../src/domain/models/index.js";
import { run } from "../../src/program.js";

function writeAgents(root: string, rel: string, localChildren: string[] = []) {
  const file = path.join(root, rel);
  mkdirSync(path.dirname(file), { recursive: true });
  const created = new AgentsNode(file).create(
    {
      localChildren: localChildren.map((id) => ({
        id: path.resolve(path.dirname(file), id),
      })),
    },
    { operation: "create" },
  );
  let body = created.serialize();
  if (!body.includes("project-harness-local:start")) {
    body =
      "# Scope\n\n<!-- project-harness-local:start -->\n## 本层系统维护信息\n\n<!-- project-harness-local:end -->\n";
  }
  writeFileSync(file, body);
}

test("edges forest list returns two-dimensional system forest JSON", async (t) => {
  const root = mkdtempSync(path.join(realpathSync(tmpdir()), "forest-cli-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeAgents(root, "AGENTS.md", ["inner/AGENTS.md"]);
  writeAgents(root, "inner/AGENTS.md");

  const result = await run(["--scope", root, "forest", "list"], { env: {} });
  assert.equal(result.exitCode, 0, result.stdout + result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.status, "success");
  assert.equal(payload.form, "independent");
  assert.ok(Array.isArray(payload.trees));
  assert.ok(payload.trees.length >= 2);
  const roots = payload.trees.map((tree: { root: string }) => tree.root);
  assert.ok(roots.some((r: string) => r === "AGENTS.md" || r.endsWith(`${path.sep}AGENTS.md`)));
  assert.ok(roots.some((r: string) => r === "inner/AGENTS.md" || r.endsWith(`${path.sep}inner${path.sep}AGENTS.md`)));
  for (const tree of payload.trees) {
    assert.ok(Array.isArray(tree.nodes));
    assert.ok(tree.nodes.every((n: { path: string; type: string }) => n.path && n.type));
  }
});
