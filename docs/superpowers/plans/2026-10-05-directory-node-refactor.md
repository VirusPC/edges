# Directory Node Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将已确认的统一目录、Internal/Leaf 模型与递归 harness 落地到 CLI、迁移和文档。

**Architecture:** Node 定义业务行为，layout 统一目录约定，Service 负责 IO/引用一致性。逐步切换模型、生命周期、业务入口与真实仓库内容；最终不保留生产双格式。

**Tech Stack:** TypeScript, Node >=20, pnpm, gray-matter defaults, node:test/tsx.

**Spec:** docs/superpowers/specs/2026-10-05-directory-node-model.md

## Global Constraints

- 重复批量操作先写可重复执行的 TypeScript 脚本；迁移须 dry-run、冲突检查与幂等性验证。

- TypeScript，Node >=20，NodeNext 相对导入使用 .js。YAML 仅使用 gray-matter 默认能力，不增加自定义引擎或容错语义。
- 不建 Resource 模型。图片、脚本等按整个目录随生命周期操作，不作为 children。
- 不强制改造 ADR、第三方技能约定目录、README、CONTEXT、knowledge/posts 或其他体系的普通文件；无有效入口的目录只是导航目标。
- 不实施 extensions/memory 分发与 immutable 优化；保留已建待办。
- 不迁移真实私有内容，不修改 .obsidian/workspace.json，不做 chmod 权限策略。
- 每个实现 Agent 使用独立 worktree/branch；禁止共用写目录。受管 memory 使用 CLI/Service 修改。

## File map

- models/layout.ts: entry/module/harness/section/lifecycle conventions.
- models/types.ts, base-node.ts, leaf-node.ts, internal-node.ts, internal-syntax.ts, relations.ts: common model and source preserving references.
- models/{task,memory,skill,note}-node.ts: leaf business implementations.
- services/node-service.ts, traverse.ts, node-files.ts and focused helper modules: filesystem coordination and snapshots, no resource domain.
- services/{memory,tasks,note}/ and commands/: business CLI adaptation.
- scripts/migrate-directory-nodes.ts + matching test + migration Skill: one-time old file conversion.
- README, CONTEXT, ADR, current specs, protocols, indexed memories: current contract and ownership.

### Task 1: Node models and layout

**Files:** create models/leaf-node.ts, models/layout.ts; modify models/*.ts, internal syntax and direct callsites in services; test test/models/{documents,internal,directory-model}.test.ts and test/services/production-nodes.test.ts.

**Interfaces:** consumes gray-matter document utility and existing lossless Internal syntax. Produces all Node classes and NodeReference/ChildGroup/inputs/NodeContext from spec. Preserve current Service ability to compile using mechanical interface adaptation, leaving lifecycle rewrite to Task 2. Do not introduce deprecated aliases target/label/kind or localMemory/descendantMemory.

- [x] Add failing behavior cases:
```ts
const skill = new SkillNode('/repo/skills/a/SKILL.md');
assert.equal(skill.id, '/repo/skills/a/SKILL.md');
assert.equal(skill.isLeaf, true);
const root = new InternalNode('/repo/AGENTS.md').parse(sourceWithExtraProse);
root.addChild('local', { id: skill.id, name: 'A' });
assert.deepEqual(root.localChildren.map(x => x.id), [skill.id]);
assert.equal(root.serialize().includes('my untouched comment'), true);
assert.equal(root.serialize().includes('skills/a/SKILL.md'), true);
assert.throws(() => root.addChild('descendant', { id: skill.id }));
```
- [x] Run `pnpm --filter edges-cli exec node --test --import tsx './test/models/*.test.ts'`; record meaningful failing baseline.
- [x] Implement `BaseNode implements NodeReference`, generics Create/Update, path ID, fixed isLeaf, common fields, Leaf subclass and polymorphic create/update/destroy/validate. Make mutations validate first; preserve unedited metadata/body.
```ts
// Controlled relation changes remain package internal; reference projection copies only three fields.
const reference = { id: node.id, ...(node.name ? {name:node.name} : {}), ...(node.description ? {description:node.description} : {}) };
// Internal serialize converts absolute IDs to href relative to its entry directory.
```
- [x] Adapt direct consumers mechanically to new reference and group API, resolve IDs at parse boundary, retain authored href for untouched source/fragment fidelity. Add validation/creation tests for Task/Memory/Skill and rollback-on-invalid-update; no filesystem in nodes.
- [x] Run model tests and `pnpm --filter edges-cli exec tsc --noEmit`; fix compile regressions, report runtime behavior intentionally pending Task 2/3.
- [x] Commit `refactor: define directory nodes and recursive harness layout` with Co-authored-by trailer. Task reviewer gates spec + code quality.

**Evidence:** Models31/31、CLI TypeScript 通过；独立审阅与修复复审通过。提交 be1d4fc、6d6d4d8。Service/CLI 仍由后续任务完成。

### Task 2: Service lifecycle and traversal

**Files:** services/node-service.ts, node-files.ts, node-resources.ts (simplify/remove), traverse.ts; add focused services/node-layout.ts or node-operation helpers as necessary; services adapters callsite changes; test/services/*.test.ts.

**Interfaces:** consumes models/layout and spec model methods. Produces spec NodeService CRUD/move/import/list, with explicit managedRoot and typed get overload; returns same node for mutations. No public reparent. Business assertWrite/read-only hooks retained; no createMode/resourceMode. Task 3 replaces legacy production file paths; this task migrates relevant test fixtures to directories.

- [ ] Add real tempfile tests before implementation for Skill directory with AGENTS harness and .harness/AGENTS; list must visit composition only, never nested harness. Explicit get(harness.id) loads maintenance tree when requested.
```ts
const node = await service.get('/managed/skills/a/SKILL.md');
const moved = await service.move(node!, '/managed/skills/b/SKILL.md');
assert.equal(moved, node);
assert.equal(node!.id, '/managed/skills/b/SKILL.md');
assert.equal(existsSync('/managed/skills/b/AGENTS.md'), true);
assert.equal(existsSync('/managed/skills/a'), false);
```
- [ ] Run `pnpm --filter edges-cli exec node --test --import tsx './test/services/*.test.ts'` and capture failures showing missing new behavior.
- [ ] Implement layout-based loading, physical parent + harness references, group traversal, optional generic navigation skipping, model-dispatched operations and managed-root boundary checks.
- [ ] Implement directory lifecycle plan: preflight conflicts, proposed parent/index changes, relative link rewrites in managed nodes preserving source/query/fragment, snapshots and IO, then in-place path/relations state refresh. Reuse safe existing file operations; split focused helpers rather than growing a monolith.
```ts
const original = node.path;
// Compute all file changes and validate before writing any; only commit model state after IO succeeds.
// Destination entry keeps basename(original); ownership unit determined by layout incl. co-located harness.
assert.notEqual(destinationEntry, original); // no-op separately supported
```
- [ ] Tests: nested Internal move; old/new parent; outside-to-moved and moved-to-outside refs; cached instances; occupied target; path escaping; Skill destroy removes harness; deleting co-located harness preserves Skill; import entire directory validates before writes; source untouched on error; business read-only origin; symlink boundary; private-ignore adapter remains.
- [ ] Remove reparent tests in favor of physical move invariants; no tests asserting intentionally removed permission policies. Run service/model tests + tsc and affected adapters tests.
- [ ] Commit `refactor: coordinate node directory lifecycle through services`; task review.

### Task 3: CLI adapters and explicit uniform-directory migration

**Files:** services/memory/{node-documents,entries,remember,types,doctor,init}.ts plus related modules; services/tasks/{write,paths,...}.ts; services/note/git/ingest.ts; command input wiring; scripts/migrate-directory-nodes.ts; package.json; new extensions/skills/migrate-directory-nodes/SKILL.md; relevant test/{memory,tasks,note,services}; migration tests.

**Interfaces:** consumes new NodeService/model interfaces. Produces directory-only new writes/recognition; explicit migration with dry-run default, --apply, --root and public tracked scope. Existing Markdown note ingest becomes validated import/create, no blind permissive parser. Keep observable useful CLI parameter names unless they advertise legacy formats.

- [ ] Add failing CLI integration: memory remember returns `<slug>/index.md`, Tasks create always directory, Note ingest stores directory; invalid document reports path/field and does not write, extra sections survive update.
```ts
await initMemory({ targetDir: fixtureRoot, memoryTypes: ['project'] });
const result = await rememberMemory({ targetDir: fixtureRoot, type: 'project', slug: 'demo', title: 'Demo', description: 'When testing', content: 'extra user prose' });
assert.equal(basename(result.path), 'index.md');
assert.equal(readFileSync(join(fixtureRoot, result.path), 'utf8').includes('extra user prose'), true);
```
- [ ] Run focused actual test files via node --test --import tsx; record behavioral failures.
- [ ] Adapt adapters to prepare context and structured inputs then call node/service. Remove file/directory choice from user-facing options; do not move domain logic into generic Service. Task sidecars move with directory. Memory indices reconstruct relative entry links. Update template/protocol paths.
- [ ] Implement migration plan using tracked public managed entries only, target `<stem>/index.md`, rewrite registered node hrefs and moved-document relative resource links, no source content loss. Fail target collision before mutation. No scanning private content; no guessing asset ownership. Exclude posts/thirdparty/ADRs. Existing Skill dirs/entry dirs unchanged.
```ts
const plan = planDirectoryMigration(root);
assert.deepEqual(plan.moves.map(x => x.to), [join(root, '.harness/memory/projects/project_demo/index.md')]);
applyDirectoryMigration(plan);
assert.equal(planDirectoryMigration(root).moves.length, 0);
```
- [ ] Test dry-run unchanged, real apply correct, rerun idempotent, collision unchanged, fragment/encoded href, relative assets preserved, private and external documents excluded; old interrupted journal rejected with actionable path.
- [ ] Run affected CLI/service/model tests + build/typecheck; commit `feat: use directory nodes across cli and provide migration`; task review.

### Task 4: Repository adoption, ownership completion and validation

**Files:** tracked public managed entries, indexes, README.md, CONTEXT.md, docs/adr relevant current model ADR, old spec supersession pointer, new spec, skill docs/protocol, discussion completion status. Exclude posts and private files.

**Interfaces:** consumes Task 3 migration/CLI. Produces migrated repository plus verified documentation and completed checks.

- [ ] Use new Service/CLI to move cloud Obsidian deployment memory to root Project Memory and its managed Skill to root managed Skills; refresh both indices. Consolidate fact/idea method minimally in conversation-to-tasks without adding new mandatory fields; history memory points to method.
- [ ] Run migration dry-run on tracked public nodes and review plan against excluded paths, then --apply. Verify idempotence and all rewritten registered links. Restore ownership stays local; no root promotion of descendants.
- [ ] Update README implementation state, glossary and current ADR/spec/skill contracts to actual model, localChildren/descendantChildren and default traversal boundary. Preserve historical plan results as historical.
- [ ] Run `pnpm test`, `pnpm build`, root migration script strict typechecks and git diff --check; record commands/results/counts. Resolve failures, do not merely remove assertions.
- [ ] Review final full branch with an independent architecture/TS reviewer; fix Critical/Important, verify scoped fixes. Commit and update existing draft PR161 with concrete final changes and new evidence; no merge/release.
