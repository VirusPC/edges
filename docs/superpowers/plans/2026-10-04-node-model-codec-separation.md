# Node Model / Codec / Storage Separation

> 后续用户修正：这些能力现已迁入 [CLI 的 TypeScript utils](../../../extensions/cli/src/utils/node-tree/README.md)，不再使用独立 `@edges/node-tree` 包；frontmatter 改用 `gray-matter` / `js-yaml`，取消 YAML 注释和样式保留目标。下文旧包路径、旧实现与验证属于历史记录，现行约定以链接的 API 文档为准。

> **For agentic workers:** Use executing-plans. The user approved this continuation in the current isolated worktree.

**Goal:** Separate the three-part node model, Markdown codec, filesystem adapter and CLI consumers; support loss-preserving serialization and explicit saves.

**Architecture:** Model values contain text/link runs in constraints, local memory and children, plus ordinary references outside those sections. They contain neither AST nor paths/source files. The Markdown codec translates model values and preserves untouched source fragments when supplied the original source. Storage handles reading, path resolution and guarded file replacement. A repository composition API loads model/source/location together for CLI consumption.

**Tech Stack:** Native ESM/checkJs, TypeScript tests and CLI, existing CommonMark parser.

**Spec:** ADR 0024 and the user-confirmed separation of domain model, parsing/serialization, filesystem and CLI.

## Constraints

- Retain the existing isolated worktree and PR; do not migrate real memories or edit knowledge/posts.
- Keep the original three AGENTS sections, including the existing 本层硬约束 title alias. Preserve unknown sections, comments, manual text and unchanged formatting.
- Resolve link paths only in filesystem adaptation; parser/model must work without a directory.
- Preserve current CLI selection and Tasks inventory policy.
- Reject ambiguous duplicate/unclosed section layouts on editing, and stale file snapshots on saving, rather than overwrite uncertain material.

## Task 1 — Domain and codec

Files: `extensions/packages/node-tree/src/model.js`, `src/codec/{parse,serialize}.js`, `test/codec.test.ts`.
Interfaces: `parseNode(source): NodeModel`; `serializeNode(model, originalSource?): string`; `NodeModel` contains `constraints`, `memory`, `children` item arrays and ordinary `references`. Each item is an array of format-independent text/link runs.

- [x] Write failing tests for three-part extraction without paths, exact unchanged round trips, partial edits with unknown/manual content preserved, new entries, removal, Unicode/CRLF and malformed section protection.
- [x] Implement pure model and CommonMark codec; retain raw source/ranges only in private codec metadata.
- [x] Build and pass codec tests; prove serialized output reparses to the requested model.

## Task 2 — Storage and composition

Files: `src/filesystem.js`, `src/paths.js`, `src/repository.js`, `src/index.js`, existing node-tree and CLI scope tests/adapter.
Interfaces: `readNode(directory)` returns `{location, source, identity, model, links}`; `saveNode(loaded, model)` serializes and explicitly saves with stale-source detection. Filesystem adapter owns IO, absolute paths, boundary checks and replacement; repository combines it with codec. Core tree algorithms remain independent.

- [x] Write failing temporary-filesystem tests for save/reload, stale edits and symlink rejection.
- [x] Move path resolution out of parser and compose the layers; migrate CLI/Tests to the loaded-node envelope.
- [x] Run core, CLI scope and full workspace tests; verify native runtime remains usable without build artifacts.

## Task 3 — Review and delivery

- [x] Update package docs and ADR, record the decision in project memory.
- [x] Obtain independent review, fix actionable findings and rerun affected checks.
- [x] Record verification, commit, push and update the existing draft PR.

## Verification evidence

- Core package checkJs/type declarations and CLI TypeScript build passed.
- `pnpm test`: 398 passed: node-tree 32, CLI 283, MCP 14, artifacts service 42, review app 27.
- Round-trip tests cover exact no-op preservation, BOM/CRLF, edits/additions/removal/reordering, retained image/HTML fragments, heading navigation, ordinary reference placement and JSON property order.
- Storage tests cover save/reload, stale source, final-entry symlinks and ancestor-directory substitution with identical bytes. Native runtime import without generated output remains green.
- Independent review approved after the preservation, insertion-boundary and file-identity regressions were fixed; no outstanding findings.
- This change does not migrate real node memories or switch CLI scope eligibility/Tasks inventory policy; Python adoption remains separate.
