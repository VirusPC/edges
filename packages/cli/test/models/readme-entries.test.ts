import assert from "node:assert/strict";
import test from "node:test";
import { ReadmeNode } from "../../src/domain/models/index.js";

const md = `# Root

Intro.

<!-- edges-entries-local:start -->
## 本层内容

- [Tasks](tasks/README.md) — domain board
<!-- edges-entries-local:end -->

<!-- edges-entries-descendants:start -->
## 下层内容

- [Nested](nested/README.md) — nested org
<!-- edges-entries-descendants:end -->
`;

test("readme entries parse local and descendant content", () => {
  const node = new ReadmeNode("/repo/README.md").parse(md);
  assert.equal(node.type, "readme");
  assert.deepEqual(node.localChildren.map((c) => c.id), ["/repo/tasks/README.md"]);
  assert.deepEqual(node.descendantChildren.map((c) => c.id), ["/repo/nested/README.md"]);
  assert.match(node.serialize(), /edges-entries-local:start/);
  assert.match(node.serialize(), /## 本层内容/);
});

test("readme round-trips and creates entries sections", () => {
  assert.equal(new ReadmeNode("/repo/README.md").parse(md).serialize(), md);
  const fresh = new ReadmeNode("/repo/README.md").parse("# T\n");
  const out = new ReadmeNode("/repo/README.md")
    .parse("# T\n")
    .update({ localChildren: [{ id: "/repo/a/README.md", name: "A" }] })
    .serialize();
  assert.match(out, /edges-entries-local:start -->\n## 本层内容/);
  assert.doesNotMatch(out, /<!-- edges/);
  assert.equal(fresh.children.length, 0);
});
