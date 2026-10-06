import test from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { InternalNode } from "../../src/domain/models/internal/internal-node.js";
import { initMemory, doctorMemory } from "../../src/services/memory/index.js";
import { layerTypeSpecs } from "../../src/services/memory/types.js";
function fixture(t: any) {
  const root = fs.realpathSync(
    fs.mkdtempSync(join(tmpdir(), "memory-adoption-")),
  );
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}
const ownerText = (local: string, tail = "") =>
  `# Owner\n\n<!-- authored: keep -->\n<!-- project-memory-important:start -->\nImportant manual text.\n<!-- project-memory-important:end -->\n<!-- project-memory-local:start -->\n## Authored pointers\n\n${local}\n<!-- project-memory-local:end -->\n${tail}`;
for (const [kind, href] of [
  ["plain", ".harness/memory/projects/AGENTS.md"],
  ["angle", "<.harness/memory/projects/AGENTS.md>"],
  ["encoded-angle", "<.harness/memory/%70rojects/AGENTS.md#entries>"],
] as const) {
  test(`Memory ${kind} local adoption recognizes missing type indexes and Doctor preserves authored links`, async (t) => {
    const root = fixture(t);
    await initMemory({ indexGroup: "descendant", targetDir: root, memoryTypes: ["project"] });
    const text = ownerText(`- [projects](${href}) — hand written description`);
    fs.writeFileSync(join(root, "AGENTS.md"), text);
    assert.deepEqual((await doctorMemory({ indexGroup: "descendant", targetDir: root })).findings, []);
    await doctorMemory({ indexGroup: "descendant", targetDir: root, apply: true });
    assert.equal(fs.readFileSync(join(root, "AGENTS.md"), "utf8"), text);
    fs.unlinkSync(join(root, ".harness/memory/projects/AGENTS.md"));
    assert.deepEqual(
      layerTypeSpecs(root).map((spec) => spec.name),
      ["project"],
    );
    const findings = (await doctorMemory({ indexGroup: "descendant", targetDir: root })).findings;
    assert.equal(findings.filter((f) => f.code === "missing-index").length, 1);
    assert.equal(
      findings.some((f) => f.code === "unregistered-type"),
      false,
    );
    assert.equal(fs.readFileSync(join(root, "AGENTS.md"), "utf8"), text);
  });
}
for (const kind of ["descendant", "prose", "local-prose"] as const)
  test(`Memory ${kind} references do not adopt a local type`, async (t) => {
    const root = fixture(t),
      line = "- [projects](<.harness/memory/%70rojects/AGENTS.md>) — not local";
    const tail =
      kind === "descendant"
        ? `<!-- project-memory-children:start -->\n${line}\n<!-- project-memory-children:end -->\n`
        : `\n## Other prose\n${line}\n`;
    fs.writeFileSync(
      join(root, "AGENTS.md"),
      ownerText(
        kind === "local-prose" ? line.slice(2) : "",
        kind === "local-prose" ? "" : tail,
      ),
    );
    assert.deepEqual(layerTypeSpecs(root), []);
    assert.equal(
      (await doctorMemory({ indexGroup: "descendant", targetDir: root })).findings.some(
        (f) => f.code === "missing-index",
      ),
      false,
    );
  });
test("InternalNode generated local references are recognized as adopted types", async (t) => {
  const root = fixture(t),
    node = new InternalNode(join(root, "AGENTS.md")).parse(ownerText(""));
  node.addChild("local", {
    id: join(root, ".harness/memory/projects/AGENTS.md"),
    name: "projects",
    description: "project context",
  });
  fs.writeFileSync(node.path, node.serialize());
  assert.deepEqual(
    layerTypeSpecs(root).map((spec) => spec.name),
    ["project"],
  );
  assert.equal(
    (await doctorMemory({ indexGroup: "descendant", targetDir: root })).findings.filter(
      (f) => f.code === "missing-index",
    ).length,
    1,
  );
});
test("reviewed restored owner AGENTS and type indexes have no false Doctor adoption findings", async (t) => {
  const root = fixture(t),
    repo = join(import.meta.dirname, "../../../..");
  const manifest = JSON.parse(
    fs.readFileSync(
      join(
        repo,
        "docs/superpowers/plans/2026-10-05-local-ownership-correction.json",
      ),
      "utf8",
    ),
  );
  const owners = [
    "extensions",
    "extensions/skills/project-memory-init",
    "shared-extensions",
    "knowledge/notes",
    ".harness/tasks",
  ];
  for (const edit of manifest.edits) {
    if (
      !owners.some(
        (owner) =>
          edit.path === `${owner}/AGENTS.md` ||
          edit.path.startsWith(`${owner}/.harness/`),
      )
    )
      continue;
    fs.mkdirSync(join(root, edit.path, ".."), { recursive: true });
    fs.writeFileSync(join(root, edit.path), edit.after);
  }
  for (const move of manifest.moves) {
    fs.mkdirSync(join(root, move.target, ".."), { recursive: true });
    fs.writeFileSync(join(root, move.target), move.after);
  }
  const { execFileSync } = await import("node:child_process");
  const { planDirectoryMigration, applyDirectoryMigration } =
    await import("../../../../scripts/migrate-directory-nodes.mjs");
  execFileSync("git", ["init", "-q"], { cwd: root });
  execFileSync("git", ["add", "."], { cwd: root });
  applyDirectoryMigration(planDirectoryMigration(root));
  const { planAgentsIndexes, applyAgentsIndexes } = await import("../../../../scripts/migrate-agents-indexes.mts");
  await applyAgentsIndexes(planAgentsIndexes(root));
  for (const owner of owners) {
    const report = await doctorMemory({ indexGroup: "descendant",
      targetDir: join(root, owner),
      rootDir: join(root, owner),
    });
    assert.deepEqual(
      report.findings.filter((f) => !["source-scan-error"].includes(f.code)),
      [],
      owner,
    );
    assert.ok(
      report.findings.some((f) => f.code === "source-scan-error"),
      owner,
    );
  }
});
test("existing type files still require a local edge rather than a descendant or prose reference", async (t) => {
  const root = fixture(t);
  await initMemory({ indexGroup: "descendant", targetDir: root, memoryTypes: ["project"] });
  const line =
    "- [projects](<.harness/memory/%70rojects/AGENTS.md>) — descendant";
  fs.writeFileSync(
    join(root, "AGENTS.md"),
    ownerText(
      "[prose](<.harness/memory/projects/AGENTS.md>)",
      `<!-- project-memory-children:start -->\n${line}\n<!-- project-memory-children:end -->\n`,
    ),
  );
  const findings = (await doctorMemory({ indexGroup: "descendant", targetDir: root })).findings;
  assert.equal(
    findings.filter((f) => f.code === "unregistered-type").length,
    1,
  );
});

test("reviewed public root graph loads document entries and keeps ADR navigation outside ownership", async (t) => {
  const root = fixture(t);
  const manifest = JSON.parse(
    fs.readFileSync(
      join(
        import.meta.dirname,
        "../../../../docs/superpowers/plans/2026-10-05-local-ownership-correction.json",
      ),
      "utf8",
    ),
  );
  const source = manifest.edits.find(
    (edit: { path: string }) => edit.path === "AGENTS.md",
  ).after;
  fs.writeFileSync(join(root, "AGENTS.md"), source);
  fs.mkdirSync(join(root, "docs/adr"), { recursive: true });
  const { NodeService } = await import("../../src/services/node/node-service.js");
  const service = new NodeService({ managedRoot: root });
  const node = await service.get(join(root, "AGENTS.md"), InternalNode);
  assert.ok(node);
  assert.equal(
    node.children.some((ref) => ref.id === join(root, "docs/adr")),
    false,
  );
  assert.match(source, /\n\[架构决策\]\(<docs\/adr\/>\) — 架构决策入口。\n/);
  for (const ref of node.children) {
    const file = ref.id;
    fs.mkdirSync(join(file, ".."), { recursive: true });
    // All graph contents are fixture placeholders, including the private adoption.
    fs.writeFileSync(file, "# Fixture entry\n");
    assert.ok(await service.get(file));
  }
  const listed = await service.list(root);
  assert.equal(listed.length, 1 + node.localChildren.length);
  assert.ok(listed.every((entry) => fs.statSync(entry.path).isFile()));
  assert.equal(fs.readFileSync(join(root, "AGENTS.md"), "utf8"), source);
});
