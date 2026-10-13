# Node Tree / CLI Decoupling Implementation Plan

> 后续用户修正：这些能力现已迁入 [CLI 的 TypeScript utils](../../../extensions/cli/src/utils/node-tree/README.md)，不再使用独立 `@edges/node-tree` 包；frontmatter 直接采用 `gray-matter` 默认解析/序列化，删除自定义格式行为及 `js-yaml` 直接依赖；不合约定的文档直接修正。下文旧包路径、旧实现与验证属于历史记录，现行约定以链接的 API 文档为准。

> **For agentic workers:** Use executing-plans to implement this plan task-by-task. User has authorized implementation in the current isolated worktree.

**Goal:** Extract reusable node discovery and recursion from CLI/Tasks, preserving existing command selection and output contracts.

**Architecture:** Add the private workspace package `@edges/node-tree` at `extensions/packages/node-tree`. It exposes filesystem nodes, ancestor search, generic cycle-safe traversal and explicit AGENTS child-reference traversal without CLI environment or Tasks dependencies. CLI supplies its current selection predicate and Git/directory boundary policies; filesystem inventory and logical child traversal remain separate operations.

**Tech Stack:** Native ESM JavaScript with JSDoc/checkJs-generated types, TypeScript CLI, Node filesystem APIs, node:test and pnpm workspace. Use the workspace-existing `mdast-util-from-markdown` parser as an explicit runtime dependency to distinguish real links from Markdown examples.

**Spec:** [ADR 0024: recursive tree / CLI decoupling](../../adr/0024-scope-first-content-ownership.md#递归树结构).

## Constraints

- Work in the existing isolated `codex/recursive-scope-layout` worktree; do not edit `knowledge/posts/` or local private memories.
- Do not restore or migrate local memories as part of this code refactor.
- Every regular AGENTS file can be read as a node. Existing CLI scope eligibility remains an explicit adapter policy until the whole node migration is applied.
- Child ownership links and ordinary references are distinct; directory scanning does not infer logical ownership.
- No environment, process cwd, Git fallback or business error dependencies in the public core. Caller supplies starting paths and boundary policies.
- Keep CLI `--scope > EDGES_SCOPE > EDGES_REPO > cwd ancestor` precedence and validation exit codes. Keep current Tasks `all` physical inventory until a separate behavior change is agreed.
- Python runtime remains an independent consumer to adapt later; do not claim cross-language implementation sharing in this change.

## Task 1: Reusable node package

**Files:** `extensions/packages/node-tree/{package.json,tsconfig.json,src/index.js,src/tree.js,src/filesystem.js,src/links.js,test/node-tree.test.ts,README.md}`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`.

**Interfaces:** `walkTree<T>(root, children, key): T[]`; `findAncestor(start, matches, stopAt?): string | undefined`; `readNode(directory): NodeEntry | undefined`; `discoverNodes(root, options?): NodeEntry[]`; `readNodeTree(root, options?): NodeEntry[]`. `NodeEntry` carries directory, entryPath, content, children and references. Discover options accept a node predicate and directory-entry policy; reference traversal accepts an explicit boundary directory and visit predicate.

- [x] Write real temp-directory tests. Assert a branch with links `a -> b -> a` terminates with two nodes; a child link jumping physical levels is traversed; memory/reference links do not become child ownership; code examples and remote links are ignored; repeated links are deduplicated; boundary escape, symlinks and caller-excluded repositories are not followed.
- [x] Run tests with `node --test --import tsx` and observe missing package/API failures before implementation.
- [x] Implement pure traversal, filesystem access and AGENTS local-link parsing in separate files. Preserve ordered depth-first traversal, return no ancestor when no predicate matches, and propagate unexpected filesystem failures.
- [x] Build the package and run its tests, including independent package import without CLI.

## Task 2: CLI integration

**Files:** `extensions/cli/package.json`, `extensions/cli/src/utils/scope.ts`, `extensions/cli/test/utils/scope.test.ts`; existing Tasks/config consumers retain their adapter imports.

- [x] Add tests for explicit/env/cwd precedence, missing-owner validation independent of TasksError, Git stop policies and unchanged portable IDs. Run the error-independence test against old code and observe failure.
- [x] Replace ancestor/discovery loops with core calls; keep env, Git fallback, scope eligibility and output/error translation in CLI. Add the workspace dependency and ensure CLI build/test generate core declarations; native JS runtime exports must support existing source/deployment entry paths without any prior build.
- [x] Run package tests, CLI scope/config tests and the full CLI test suite; build CLI and invoke built help outside the repository to verify runtime package resolution.

## Task 3: Review and documentation

**Files:** package and CLI READMEs, ADR 0024, spec status, project memory if needed.

- [x] Document physical inventory vs logical recursion, current adapter policy, reusable API and deferred Python adoption/local-memory restoration.
- [x] Request an independent TypeScript review, fix substantive findings and rerun affected tests.
- [x] Record actual verification evidence, commit and push the existing draft PR. Do not merge.

## Verification evidence

- `pnpm --filter edges-cli build`: passed, including public-package checkJs/type declarations and CLI TypeScript compilation.
- `pnpm test`: 380 tests passed: node-tree 14, CLI 283, MCP 14, artifacts service 42, review app 27.
- Built CLI `--help` succeeded from `/tmp`; isolated native package import succeeded without dist, CLI or a TypeScript loader.
- Red/green evidence: Tasks-coupled missing-owner error failed before extraction; code/comment false ownership and runtime-without-build tests failed before fixes; duplicate/nested reference-definition tests failed before first-wins collection.
- Independent review approved after fixing runtime packaging, Markdown example parsing and reference-definition precedence. No outstanding findings.
- Existing Vite deprecation and app dependency peer warnings remain unchanged; no Python code or local-memory ownership migration was performed.
