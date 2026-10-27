import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import { ReadmeNode } from "../../src/domain/models/index.js";
import {
  ComposeReadmeNode,
  composeReadmeSeed,
  hrefForScopeCheckout,
} from "../../src/domain/models/compose/compose-readme-node.js";
import { readmeModelFor } from "../../src/domain/models/readme/specialize.js";
import { traverse } from "../../src/domain/operations/traverse.js";
import { NodeService } from "../../src/services/node/node-service.js";
import { collectSystemRoots } from "../../src/services/node/system-roots.js";

const FILE = "/repo/.edges/compose/README.md";

function compose(body = ""): ComposeReadmeNode {
  return new ComposeReadmeNode(FILE).parse(body || composeReadmeSeed()) as ComposeReadmeNode;
}

test("compose entry is the real compose/README.md and a ReadmeNode subclass", () => {
  const node = compose();
  assert.equal(node.type, "readme");
  assert.ok(node instanceof ReadmeNode);
  assert.ok(node instanceof ComposeReadmeNode);
  assert.equal(readmeModelFor(FILE), ComposeReadmeNode);
  assert.equal(readmeModelFor("/repo/.edges/README.md"), ReadmeNode);
  assert.equal(node.childTraversal(), "leaf");
  assert.equal(node.path, FILE);
});

test("child id is the composed README and the default href does not double the checkout path", () => {
  const node = compose();
  node.addChild({
    name: "brain",
    description: "个人大脑",
    remote: "https://github.com/example/brain.git",
  });
  const entry = node.entries()[0];
  assert.equal(entry?.href, "brain/README.md");
  assert.equal(entry?.id, "/repo/.edges/compose/brain/README.md");
  assert.equal(entry?.directory, "/repo/.edges/compose/brain");
  assert.deepEqual(node.children, [{
    id: "/repo/.edges/compose/brain/README.md",
    name: "brain",
    description: "个人大脑",
  }]);
  const source = node.serialize();
  assert.match(source, /\[brain\]\(<brain\/README\.md>\) — 个人大脑 remote: https:\/\/github\.com\/example\/brain\.git/);
  assert.doesNotMatch(source, /\.edges\/compose\/brain/);
  const loaded = new ComposeReadmeNode(FILE).parse(source) as ComposeReadmeNode;
  assert.equal(loaded.entries()[0]?.remote, "https://github.com/example/brain.git");
  assert.equal(loaded.serialize(), source);
});

test("a scope-relative --path is stored as a README href relative to .edges/compose", () => {
  const href = hrefForScopeCheckout(FILE, "/repo", "vendor/team");
  assert.equal(href, "../../vendor/team/README.md");
  const up = hrefForScopeCheckout(FILE, "/repo", "../notes");
  assert.equal(up, "../../../notes/README.md");
  const node = compose();
  node.addChild({ name: "team", href, description: "团队库" });
  assert.equal(node.checkout("team").directory, "/repo/vendor/team");
  assert.equal(node.entries()[0]?.id, "/repo/vendor/team/README.md");
  assert.throws(() => hrefForScopeCheckout(FILE, "/repo", "/var/composed/abs"), /must be relative/);
  assert.throws(() => hrefForScopeCheckout(FILE, "/repo", "~/custom"), /must be relative/);
  assert.throws(() => node.addChild({ name: "self", directory: "." }), /own directory/);
});

test("legacy absolute and ~ hrefs still read from compose/README.md", () => {
  const node = new ComposeReadmeNode(FILE).parse(`# 组合

<!-- edges-compose:start -->
## 组合

- [old](<~/.edges/composed/old>) — 旧 remote: https://github.com/example/old.git
- [abs](</var/composed/abs>) — 绝对
<!-- edges-compose:end -->
`) as ComposeReadmeNode;
  assert.equal(node.checkout("old").directory, path.join(homedir(), ".edges", "composed", "old"));
  assert.equal(node.entries()[0]?.id, path.join(homedir(), ".edges", "composed", "old", "README.md"));
  assert.equal(node.checkout("abs").directory, "/var/composed/abs");
  assert.equal(node.entries()[1]?.id, "/var/composed/abs/README.md");
  assert.match(node.serialize(), /\[old\]\(<~\/\.edges\/composed\/old>\)/);
});

test("default traverse expands the composed README; --exclude compose skips it", async () => {
  const node = compose();
  node.addChild({ name: "brain", description: "个人大脑" });
  const child = new ReadmeNode("/repo/.edges/compose/brain/README.md").parse(`# Brain

<!-- edges-entries-local:start -->
## 本层内容

- [nested](<nested/README.md>) — nested
<!-- edges-entries-local:end -->
`);
  const nested = new ReadmeNode("/repo/.edges/compose/brain/nested/README.md").parse("# Nested\n");
  const entries = new Map([node, child, nested].map((item) => [item.id, item]));
  const collect = async (exclude?: ReadonlySet<string>) => {
    const paths: string[] = [];
    for await (const found of traverse(
      node,
      { scopeDir: "/repo", ...(exclude ? { exclude } : {}) },
      (_parent, ref) => entries.has(ref.id) ? ref.id : undefined,
      async (_parent, _ref, id) => entries.get(id)!,
    )) paths.push(found.path);
    return paths;
  };
  assert.deepEqual(await collect(), [FILE, "/repo/.edges/compose/brain/README.md"]);
  assert.deepEqual(await collect(new Set(["compose"])), [FILE]);
});

test("NodeService list yields the composed README by default and --exclude compose skips the module", async (t) => {
  const root = mkdtempSync(path.join(tmpdir(), "compose-readme-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const scope = path.join(root, "scope");
  const brain = path.join(scope, ".edges", "compose", "brain");
  mkdirSync(path.join(brain, "nested"), { recursive: true });
  writeFileSync(path.join(scope, "AGENTS.md"), `# Scope

<!-- edges:start -->
<!-- edges-local:start -->
## 本层系统维护信息

- [材料](<.edges/README.md>) — index
<!-- edges-local:end -->
<!-- edges:end -->
`);
  writeFileSync(path.join(scope, ".edges", "README.md"), `# 材料

<!-- edges-entries-local:start -->
## 本层内容

- [组合](compose/README.md) — 被组合的 harness 仓库。
<!-- edges-entries-local:end -->
`);
  writeFileSync(path.join(scope, ".edges", "compose", "README.md"), `# 组合

<!-- edges-compose:start -->
## 组合

- [brain](<brain/README.md>) — 个人大脑 remote: https://github.com/example/brain.git
<!-- edges-compose:end -->
`);
  writeFileSync(path.join(brain, "README.md"), "# Brain\n");
  writeFileSync(path.join(brain, "AGENTS.md"), `# Brain

<!-- edges:start -->
<!-- edges-descendants:start -->
## 下层系统维护信息

- [nested](<nested/AGENTS.md>) — nested
<!-- edges-descendants:end -->
<!-- edges:end -->
`);
  writeFileSync(path.join(brain, "nested", "AGENTS.md"), "# Nested\n");
  const service = new NodeService({ managedRoot: scope });
  const listed = (await service.list(scope)).map((node) => node.path);
  assert.ok(listed.includes(path.join(scope, ".edges", "compose", "README.md")));
  assert.ok(listed.includes(path.join(brain, "README.md")));
  assert.equal(listed.includes(path.join(brain, "AGENTS.md")), false);
  assert.equal(listed.includes(path.join(brain, "nested", "AGENTS.md")), false);
  assert.equal(listed.includes(path.join(scope, ".compose", "README.md")), false);
  const skipped = (await service.list(scope, { exclude: new Set(["compose"]) })).map((node) => node.path);
  assert.equal(skipped.includes(path.join(scope, ".edges", "compose", "README.md")), false);
  assert.equal(skipped.includes(path.join(brain, "README.md")), false);
  assert.ok(collectSystemRoots(scope).includes(path.join(brain, "AGENTS.md")));
  assert.equal(collectSystemRoots(scope, new Set(["compose"])).includes(path.join(brain, "AGENTS.md")), false);
  assert.equal(collectSystemRoots(scope, new Set(["compose"])).includes(path.join(scope, "AGENTS.md")), true);
});
