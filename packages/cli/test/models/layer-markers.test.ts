import test from "node:test";
import assert from "node:assert/strict";
import {
  INTERNAL_SECTIONS,
  INDEX_MARKERS,
  CONSTRAINTS_START,
  LOCAL_START,
  DESCENDANTS_START,
  OUTER_START,
  ENTRIES_LOCAL_START,
  TYPE_META_START,
} from "../../src/domain/config/sections.js";
import { rewriteLayerSurface } from "../../src/domain/models/node/document.js";

test("canonical layer and type markers are edges-*", () => {
  assert.equal(INTERNAL_SECTIONS.constraints.marker, "edges-constraints");
  assert.equal(INTERNAL_SECTIONS.localChildren.marker, "edges-local");
  assert.equal(
    INTERNAL_SECTIONS.descendantChildren.marker,
    "edges-descendants",
  );
  assert.equal(INTERNAL_SECTIONS.constraints.heading, "本层硬约束");
  assert.equal(INTERNAL_SECTIONS.localChildren.heading, "本层系统维护信息");
  assert.equal(INTERNAL_SECTIONS.descendantChildren.heading, "下层系统维护信息");
  assert.equal(INDEX_MARKERS.type, "edges-memory-type");
  assert.equal("entries" in INDEX_MARKERS, false);
  assert.equal(OUTER_START, "<!-- edges:start -->");
  assert.equal(CONSTRAINTS_START, "<!-- edges-constraints:start -->");
  assert.equal(LOCAL_START, "<!-- edges-local:start -->");
  assert.equal(DESCENDANTS_START, "<!-- edges-descendants:start -->");
  assert.equal(TYPE_META_START, "<!-- edges-memory-type:start -->");
  assert.equal(ENTRIES_LOCAL_START, "<!-- edges-entries-local:start -->");
});

test("rewriteLayerSurface rewrites titles and leaves old layer comments", () => {
  const source = `# T

<!-- project-memory:start -->
<!-- project-memory-important:start -->
## 本层重要约束

- Keep.
<!-- project-memory-important:end -->
<!-- project-memory-local:start -->
## 本层记忆

- [A](a/AGENTS.md)
<!-- project-memory-local:end -->
<!-- project-memory-children:start -->
## 下层作用域

- [B](b/AGENTS.md)
<!-- project-memory-children:end -->
<!-- project-memory:end -->
`;
  const out = rewriteLayerSurface(source);
  assert.match(out, /<!-- project-memory:start -->/);
  assert.match(out, /<!-- project-memory-important:start -->/);
  assert.match(out, /## 本层硬约束/);
  assert.match(out, /## 本层系统维护信息/);
  assert.match(out, /## 下层系统维护信息/);
  assert.doesNotMatch(out, /<!-- edges:start -->/);
  assert.equal(rewriteLayerSurface(out), out);

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
  assert.equal(rewriteLayerSurface(typeIndex), typeIndex);
});
