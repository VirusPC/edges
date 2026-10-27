import test from "node:test";
import assert from "node:assert/strict";
import { classifyAgentsSource } from "../../src/services/memory/agents.js";
import { rewriteLayerSurface } from "../../src/domain/models/node/document.js";

const legacy = `<!-- project-memory:start -->
<!-- project-memory-important:start -->
## 本层硬约束

- Keep.
<!-- project-memory-important:end -->
<!-- project-memory-local:start -->
## 本层记忆
<!-- project-memory-local:end -->
<!-- project-memory:end -->
`;

test("legacy layer markers are foreign", () => {
  assert.equal(classifyAgentsSource(legacy), "foreign");
});

test("type indexes are not classified as managed layer entries", () => {
  const typeIndex = `<!-- edges-memory-type:start -->
name: project
module: memory
writable: true
gitignore: false
format: ordinary
<!-- edges-memory-type:end -->
# PROJECT
<!-- edges-entries-local:start -->
- [x](project_x/index.md) — x
<!-- edges-entries-local:end -->
`;
  assert.equal(classifyAgentsSource(typeIndex), "foreign");
  assert.equal(rewriteLayerSurface(typeIndex), typeIndex);
});

test("refreshing a legacy file does not rewrite layer comments", () => {
  const updated = rewriteLayerSurface(legacy);
  assert.match(updated, /project-memory-important/);
  assert.match(updated, /## 本层系统维护信息/);
  assert.doesNotMatch(updated, /edges-constraints/);
});
