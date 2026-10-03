# Recursive Scope Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved recursive `.harness` layout, upgrade the tools that operate it, and migrate the Edges instance without losing content, ownership, or private-data protection.

**Architecture:** Scope AGENTS files directly reference type indexes in `.harness/memory` and `.harness/skills`; business modules retain their contracts. Runtime commands use only the new layout. An independent deterministic migrator converts old Project Memory; an Edges-specific migration maps business content separately.

**Tech Stack:** Python 3 standard library, TypeScript/Node, Commander, pnpm workspaces, Markdown, Git worktrees and gitlinks.

**Spec:** `docs/superpowers/specs/2026-10-03-recursive-scope-layout-design.md`

## Global Constraints

- `AGENTS.md` 是人和 Agent 的入口，硬约束仍写在所属层入口的硬约束区块。
- 本方案不另建 `.harness/skills/AGENTS.md` 总入口。Memory and harness containers also have no mandatory intermediate entry.
- 通用默认推荐模块为 `memory`、`skills`、`tasks`，供用户按作用域需要选择；“默认推荐”不表示默认创建全部目录。
- 新版常规运行只支持新布局，不运行时回退读取旧 `.memory`，不双写。
- 原位引用正文及其元数据不改写。Runtime init/remember/doctor never change installation links.
- 私有类型及索引保持忽略规则，不能仅从已跟踪文件枚举迁移对象。
- `knowledge/posts/` 原路径保留；AI 不创建、修改、移动或删除其中任何文件。
- 本机实施遵守独立 worktree 约束。Each implementation worker owns a separate checkout/branch; no shared mutation or main-checkout changes.
- `.obsidian/workspace.json` is never committed; no live deployment, benchmark API calls, or PR merge is part of this implementation.
- Commits use `type: subject` and `Co-authored-by: Codex <noreply@openai.com>`.

## File responsibilities and sequencing

Tasks 1–2 own Python memory tools; Task 3 owns CLI/MCP/task-site consumers; Task 4 owns evaluation/deployment path adapters. Task 5 alone moves the live instance and updates discovery/docs. Task 6 verifies the integrated result. Implementation workers run sequentially; a task consumes committed predecessors, with task-scoped review between tasks.

### Task 1: New-layout Project Memory runtime and selected types

**Files:**
- Modify: `extensions/skills/project-memory-init/scripts/{memory.py,lib/paths.py,lib/types.py,lib/blocks.py,lib/templates.py,nodes/agents.py,nodes/entries.py,operations/init.py,operations/add_type.py,operations/remember.py,operations/doctor.py}`.
- Modify: `extensions/skills/project-memory-init/{SKILL.md,references/LAYOUT.md,references/PROTOCOL.md,references/templates/,scripts/OVERVIEW.md}` and `extensions/skills/project-memory-{ask,remember,add-type,reshape,doctor}/SKILL.md`.
- Test: `extensions/skills/project-memory-init/scripts/tests/test_harness_layout.py` and existing runtime tests.

**Interfaces:**
- Consumes: existing frontmatter and managed AGENTS block contracts, explicit `target_dir/root_dir`.
- Produces: CLI `memory.py init --target-dir S --root-dir R --memory-types project feedback reference user --skill-types managed referenced`; either list may be omitted. A new layer with neither option returns `selectionRequired` and recommendations without mutation; an existing layer refreshes adopted types only.
- Produces: `add-type --module memory|skills` (default memory), existing `--name/--description/--skills-format/--index-only/--gitignore`; `remember --type managed` writes local Skill, `referenced` rejects writes.
- Produces: `TypeSpec.module` and scope-relative index paths; all consumers resolve through path helpers, never assume every type belongs below memory. Existing custom types keep their identity. New official types are project/feedback/reference/user/managed/referenced; old skill names are not aliases.
- Migrator in Task 2 consumes the CLI/path contract, not runtime legacy parsing.

- [x] Add real temporary-filesystem tests before implementing the paths/selection change. At minimum exercise the CLI contract:

```python
with tempfile.TemporaryDirectory() as d:
    scope = Path(d)
    subprocess.run([sys.executable, str(MEMORY), 'init', '--target-dir', d,
                    '--root-dir', d, '--memory-types', 'project',
                    '--skill-types', 'managed'], check=True)
    assert (scope / '.harness/memory/projects/AGENTS.md').is_file()
    assert (scope / '.harness/skills/managed/AGENTS.md').is_file()
    assert not (scope / '.harness/memory/users').exists()
    assert not (scope / '.memory').exists()
```

- [x] Run the new tests and record expected failures. Run Python tests with `TMPDIR=/private/tmp` on macOS to avoid `/var` alias assumptions.
- [x] Refactor type/path discovery, explicit selection, index refresh, remember/add-type and doctor. Skills-only scopes must work. A type index or business AGENTS is not a new scope; scope discovery follows managed layer contracts and explicit root boundaries, skips other Git roots/submodules and external installed links.
- [x] Make referenced scans current-scope only, retain different sources with the same name, deduplicate aliases within a type by realpath, preserve same source across both types, and distinguish missing/unreadable sources from successful empty scans. Reject managed paths that resolve outside the selected owner, including linked ancestors. Preserve manual AGENTS text.
- [x] Remove old-layout repairs from normal commands. Report migration required for legacy layers; never silently re-create `.memory`. Preserve migration-era fixtures for Task 2 rather than asserting legacy repair is current runtime behavior.
- [x] Update affected skills/templates and LAYOUT with exact new commands, recommendation/selection semantics and two-container type discovery. Do not modify the live instance's `.memory` yet.
- [x] Run `TMPDIR=/private/tmp PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s extensions/skills/project-memory-init/scripts/tests`. Archive tests are explicitly deferred to Task 2 if still bound to old archive paths; report them individually, not as runtime regressions silently ignored. Commit and report RED/GREEN evidence.

**Verified:** Runtime suite 90/90 passed; 35 harness acceptance cases. Task review and scoped fix review approved; custom permission metadata and managed format are enforced. Archive adaptation is explicitly outstanding in Task 2. Integrated commits: `c77afa1`, `c9d3b08`, `13df3f9`.

### Task 2: Deterministic migration and private-memory archives

**Files:**
- Create: `extensions/skills/project-memory-migrate/{SKILL.md,CHANGELOG.md,scripts/migrate.py,scripts/legacy.py,scripts/tests/test_migrate.py}`. Additional focused Python modules under its scripts directory are allowed for journal/link/preflight responsibilities.
- Modify: `extensions/skills/user-memory-{backup,restore}/{SKILL.md,scripts/*.py}` and their tests in `project-memory-init/scripts/tests/test_user_memory_archive.py`.
- Modify: `extensions/skills/README.md` migration/distribution inventory and memory Skill CHANGELOG files relevant to the new release.

**Interfaces:**
- Consumes: Task 1 new-layout path/type/CLI contract; all old parsing resides in this migrator.
- Produces: `migrate.py --target-dir S [--root-dir R] [--recursive] [--dry-run]`. Without dry-run, one call preflights, ignores private paths, converts, validates and finalizes; reruns are idempotent or resume interrupted work without overwriting later edits.
- Produces: machine-readable status and source/target path map; no private body content. Recovery journal/backups are ignored, permission-restricted, and bounded to selected scope.
- Backup/restore operate on `.harness/memory/users` including its index, retain safe member/path validation and explicit force replacement. Old archives get an actionable conversion-required error, never silently restore old runtime paths. A clone upgraded through Git can already have the valid new public layout while old ignored `.memory/users` remains; migration must merge only non-conflicting private remnants without resetting new public files, and report real target conflicts.

- [x] Read the skill-creator instructions before creating the migration Skill.
- [x] Add fixture tests for filesystem-enumerated ignored/untracked private records, custom ordinary/Skill types with unknown metadata and flags, full managed assets, referenced sources, sparse children and nested Git boundaries. Test original bytes/hashes for unchanged body/assets and external sources. Include a scope nested inside an old managed Skill directory: its owner path moves with the parent and its own `.memory` must map to the new owner’s `.harness`, without a second copy or leftover old subtree. Rebase owned relative symlinks to the same mapped or external target without following them to mutate external data.

```python
# Fixture setup writes the old layout, including a private untracked file.
first = run_migrate(scope, recursive=True)
assert first.returncode == 0
after = snapshot(scope)  # exclude the ignored operation journal
assert run_migrate(scope, recursive=True).returncode == 0
assert snapshot(scope) == after
assert subprocess.run(['git', '-C', str(scope), 'check-ignore',
    '.harness/memory/users/AGENTS.md'], capture_output=True).returncode == 0
```

- [x] Record RED, implement deterministic mapping and conflict detection before mutations: new built-in name collisions, different target contents, malformed/unknown flags, historical unrelated `.harness`, and symlink escapes stop the whole selected operation.
- [x] Establish private ignore coverage before any new private body/index/backup; preserve original bytes except precise existing type metadata/path references. Do not round-trip old records through `remember` or frontmatter serializers that discard unknown fields.
- [x] Retarget only explicitly mapped locally owned installation links; don't traverse an externally linked installation directory. Resolve known Markdown paths from original file location then rebase onto mapped targets; preserve manual sections and historical prose. Validate all transformed indexes and source inventory before deleting old source. Implement recoverable journal phases and tests injecting a failure after copying, then resuming safely.
- [x] Adapt backup/restore and test traversal, linked-target escape, archive occupation, force, and ignore coverage. Add the migration Skill to distribution/docs without installing or rewriting unrelated host skills.
- [x] Run migration suite plus complete Project Memory tests, review diff, commit and report.

**Verified:** Migration suite 31/31 and archive suite 12/12 passed after review fixes; the full runtime suite previously passed 90/90 and remained unchanged. Task review and scoped re-review approved. The source Skill validator rejects the repository-standard `version` key; a temporary normalized copy passes. No actual Edges instance migration was applied. Integrated commits: `702406d`, `cabfdf1`.

### Task 3: Scope-first CLI and two task purposes

**Files:**
- Modify: `extensions/cli/src/{program.ts,context.ts,utils/config.ts}`; create `extensions/cli/src/utils/scope.ts`.
- Modify: `extensions/cli/src/tasks.ts`, `src/tasks/utils/{paths,board,write,move,project-meta,result,service,grouped,generate-site}.ts` and their callers; `scripts/generate-tasks-site.ts`.
- Modify: `extensions/cli/src/note/utils/` target-path consumers and `extensions/mcp-servers/new-note/src/cliAdapter.ts`; `extensions/cli/src/artifacts/server/ops.ts` and its focused tests to separate implementation-resource lookup from target-scope resolution.
- Modify: `apps/tasks-review-app/src/` only where source identity is required for aggregate rendering/export; retain existing visual behavior.
- Test: `extensions/cli/test/{parse,run,utils/config,tasks/parse,tasks/project,tasks/run,tasks/grouped-list,tasks/utils/paths,tasks/utils/board,tasks/utils/write,tasks/utils/move,tasks/utils/project-meta,tasks/utils/grouped,tasks/utils/generate-site,note/ingest,note/utils/git-ingest}.test.ts`, affected app and MCP tests.

**Interfaces:**
- Consumes: explicit scope versus implementation/Git root distinction; task schema and Run identifiers stay unchanged.
- Produces: `edges --scope <dir> tasks --purpose domain|maintenance ...`. Explicit scope wins, then explicit `EDGES_SCOPE`, then `EDGES_REPO`, then nearest owning layer/repository of process cwd; never infer target from installed CLI source. Resolve relative scopes against cwd. No owning layer/root yields actionable validation error for writes.
- Scope discovery recognizes AGENTS with `project-memory:start` plus a managed local or children block; a type entries block, business AGENTS or `.harness` directory alone does not establish a scope. Explicit `--scope` can select a directory without auto-initializing memory. Traverse real scope descendants under `.harness/evaluation` or managed methods while respecting nested Git and symlink boundaries.
- Produces: internal `TaskBoardLocation { scopeDir: string; purpose: 'domain' | 'maintenance'; boardDir: string }`. Default purpose is domain; maintenance is always explicit. Real Git repo root remains separate for Git operations. All task paths and sidecars remain inside the selected board.
- Produces: `generate-tasks-site.ts --scope S --purpose domain|maintenance|all --out D`; all renders both sources with stable source identity (scope/purpose/project/stem) without changing stored task stems or merging records. Root deployment uses all. Single-board review-page behavior remains compatible and render-only. Aggregate transport IDs must not replace stored stems or project slugs; exports retain source scope/purpose and real project identity. Public HTML/export source scope uses a portable repository-relative path (`.` for its root), never an absolute local worktree/install path; absolute directories remain internal execution data. Prevent cross-source drag assignments that would imply an unsupported board move; same-source classification remains available.
- Note writes below selected scope's `knowledge/notes`, Git operations use actual repo root. MCP forwards explicit target via environment/CLI rather than package cwd. Artifacts service implementation location remains root-owned; its `resolveRepoRoot()` currently consumes `loadConfig().repoPath`, so decouple that resource lookup before changing target resolution. A child scope without extensions must not become the default server installer source; keep the existing explicit server source override.

- [x] Write failing real-fixture tests for nested scope, same stem in both purposes, Task/Run co-moves, selected-board path escape rejection, and cwd differing from CLI install location.

```typescript
// Each fixture is a real temp Git repo with root/child AGENTS entries.
await runCli(['--scope', child, 'tasks', '--purpose', 'maintenance', 'list']);
assert.equal(existsSync(join(child, 'knowledge/tasks')), false);
assert.equal(existsSync(join(root, '.harness/tasks/_default')), false);
```

- [x] Add scope resolver/context and thread board location through command consumers. Eliminate independent hardcodes in project metadata, migration helpers, run lookups and site generator. Reads must not initialize unrelated boards. Preserve non-index AGENTS content when inserting Task Project blocks, including entries with no Project Memory markers.
- [x] Preserve task state/priority/assignee/schema, Task Project semantics, sidecar association and run IDs. Explicit paths cannot bypass chosen scope/purpose; grouped aggregate identities include source to avoid duplicate stem collisions.
- [x] Update note/MCP target handling and persistent site generation; do not add web writeback, authentication or a second dashboard product.
- [x] Update help and public CLI docs with command examples; flag any generated deployment path work for Task 4. Run focused suites while developing, then CLI/app/MCP build and tests once; commit with RED/GREEN report.

**Verified:** CLI 276/276, app 27/27, MCP 14/14 passed; after review fixes, focused CLI 51/51, app export/drag 6/6 and TypeScript compilation passed. Independent task review and scoped re-review approved project read-only fallback and real source identity validation. Existing Vite configuration warnings remain. Deployment and instance adoption are Tasks 4/5. Integrated commits: `8e884ab`, `1226a0f`.

### Task 4: Evaluation, teaching and deployment adapters

**Files:**
- Modify before relocation: `evaluation/run_locomo_official.py`, affected evaluation test/report builders; `extensions/services/artifacts-preview/deploy/{teaching-locations.conf,migrate-teaching-nginx-prefix.py,bootstrap.sh}` as required; `test/deploy-assets.test.ts`.
- Modify: `.github/workflows/deploy.yml`, `extensions/cli/deploy/setup-nginx-tasks.sh`, deployment docs, `extensions/skills/learn-repo/SKILL.md`.
- Modify: `.gitignore`, `.obsidian/app.json`; never workspace.json.

**Interfaces:**
- Consumes: Task 3 site command with scope/purpose=all; target source paths `.harness/evaluation`, `teaching`, tasks board sites.
- Produces: unchanged public `/tasks/` and `/teaching/` served from the new physical layout; deployment migration targets only teaching location roots and preserves unrelated nginx configuration.
- Produces: evaluation root resolution valid under `.harness/evaluation`, report links relative to actual report location, and preserved smoke-case relative relationships. LoCoMo gitlink remains `cb5151e32c82c3b6fc6ffdc18e72572691b9d8ea` (revalidate original index before movement).

- [x] Add failing deployed-config fixtures using old `.../edges/knowledge` teaching roots and unrelated location roots; test exactly the teaching source changes while public URLs/unrelated roots survive.
- [x] Add evaluation location tests with the module in target depth and custom report directories, then implement root/link derivation. No live benchmark calls.
- [x] Update deployment scripts/workflow to generate all root task sources and apply teaching physical-path config migration in existing deployment flow. Source fixtures representing old configurations remain old input.
- [x] Add ignores for new private types, evaluation cache and generated task sites before migration. Preserve protective old ignore patterns until private local copies are independently migrated.
- [x] Run artifacts-preview deployment tests, evaluation print-command/smoke tests and task site tests against fixture new layout. Commit; actual git moves remain Task 5.

**Verified:** Artifacts suite 40/40, final deployment suite 13/13, smoke suite 17/17, task-site suite 4/4 and relocated evaluation command/report fixtures passed. Task review and scoped re-review approved the prefix-homepage preservation fix. Pinned-submodule crop/no-key checks remain for Task 6 after relocation. Deployment host permissions are documented, not configured or exercised live.

### Task 5: Review ownership and migrate the Edges instance

**Files:**
- Create: `scripts/migrate-recursive-layout.py` and `docs/superpowers/plans/2026-10-03-recursive-scope-ownership.json` recording public source/target/reason/hash mappings.
- Move according to manifest: `.memory`, adopted local memory, `knowledge/{tasks,projects,teaching}`, `evaluation`, `observation`.
- Modify: root and affected module `AGENTS.md`, README/CLAUDE, `.gitmodules`, unprotected Markdown links, teaching Topics/index, root CHANGELOG, design/ADR status where actual implementation is now proven.

**Interfaces:**
- Consumes: Task 2 generic migrator validated planning API, Task 3 new read/write paths, Task 4 delivery adapters. Compose generic memory states with reviewed instance ownership before writes, avoiding temporary module scopes; preserve generic preflight/type/privacy validation and validate final targets before source retirement.
- Produces: public reviewable manifest identifying every task and local memory's ownership; no private contents. Root maintenance knowledge may retain module context through prefixed entry names/links, without manufacturing independent source-package scopes. Genuine learning/teaching scopes retain their own memory when their goals/state require it.
- Produces: `scripts/migrate-recursive-layout.py --dry-run|--apply` bounded to the explicit worktree argument, consuming the reviewed manifest and generic migrator; no hardcoded Edges paths inside the generic tool.

- [x] Inventory tracked and untracked public content plus private presence (not bodies). Record protected posts hashes and original gitlink. Read each task's goal and each local record's meaning; map ownership individually, preserve task stem/status/project/sidecar and document reasons. No arbitrary task project → scope conversion.
- [x] Add an instance migration fixture with both task purposes, run sidecars, teaching pages/assets, submodule gitlink and protected posts. Verify dry-run does not mutate and apply preserves inventories/hashes while links resolve.
- [x] Compose the generic memory migration plan within the explicit worktree scope with journaled final instance mappings and Git-aware moves for the submodule. Record the reused planning API and cover its integration in fixtures. Rebase syntactically valid relative links from old locations to mapped locations, without changing historical meaning or protected posts. If a protected link cannot be preserved externally, report a concrete blocker instead of editing its body.
- [x] Build `.harness/observation/AGENTS.md` from current duties/navigation; root directly references all adopted module/type entries. Keep module discovery links in a preserved explicit section; the managed children block lists genuine scopes only, and managed local lists reference adopted type indexes. Remove README unique-authority language, keep valid existing rules discoverable at their single source. Do not generate harness/memory/skills total indexes.
- [x] Update affected current operational docs/templates/scripts and migration guide. Preserve historical source examples; no blind repository-wide replacement. Record ignored local-instance migration limits explicitly.
- [x] Verify every manifest item target/source state, new commands against actual migrated sources, private ignore coverage, unchanged protected posts hashes/gitlink, and repeat migration no-op. Cover an already Git-upgraded instance with old ignored private remnants: use reviewed ownership mappings, and never silently recreate removed module scopes. If private ownership or a collision cannot be resolved from the explicit map, report the specific conflict before mutations instead of inventing a new owner or dropping data. Commit and report remaining deviations (none may be hidden as complete).

**Verified:** Instance migration suite 20/20 and generic migration suite 32/32 passed after three scoped fix rounds. 103 Tasks, 100 Run logs, 4 assets and 52 local records were accounted for; changes to record content are only precise link rebases. Protected posts and the LoCoMo gitlink are unchanged. A second Git-upgraded worktree reproduced and then safely resumed a missing-private-index boundary using its original journal; repeat migration reports 0 operations. Doctor retains two pre-existing unavailable referenced sources in evaluation/teaching, not a fully clean result. Full integrated acceptance remains Task 6.

### Task 6: End-to-end verification and PR delivery

**Files:**
- Modify: implementation evidence in this plan and current architecture Task via new task CLI; root CHANGELOG only for implemented behavior; PR #161 title/body.

**Interfaces:**
- Consumes: complete migrated tree and all prior task reports/review packages.
- Produces: requirement-by-requirement acceptance evidence and an updated reviewable draft PR with verified commands and explicit local-instance limitations. No merge.

- [x] Run `pnpm build` and `pnpm test`; complete memory/migrator Python suites; `.harness/evaluation` print-command, smoke and official fixture tests (initialize its exact gitlink when needed).
- [x] Validate root/child memory init, managed remember, referenced no-write, archive privacy, domain/maintenance Task/Run writes and aggregate site using temporary fixtures. Validate real migrated sources read successfully without writing new old-layout paths.
- [x] Inspect protected posts diff, gitlink identity, AGENTS discoverability, local link targets and tracked secrets/private paths. Review current old-path occurrences individually as historical/migration fixtures or real defects.
- [ ] Request whole-branch spec/code review using the complete diff, fix verified issues and run covering tests; TypeScript changes require the TypeScript reviewer role. Check every explicit spec invariant against current evidence before marking completion.
- [ ] Update task/memory status via their tools, commit and push the existing isolated branch; rewrite PR #161 around implemented behavior and evidence, attach it, and report what remains local to other worktrees. Keep the full objective active if any acceptance condition is still unproven.


**Integrated verification (2026-10-03, isolated worktree):** `pnpm build` passed. `pnpm test` passed CLI 281/281, tasks-review app 27/27, new-note MCP 14/14 and artifacts-preview 42/42. The complete Python memory suite passed 102/102 (including private archive tests), generic migration 32/32 and instance migration 20/20 using `TMPDIR=/private/tmp`. Legacy smoke passed 17/17. The six official fixtures passed after retrying only the relocated-report fixture with `TMPDIR=/private/tmp`; the initial default macOS temporary path exposed a `/var` versus `/private/var` test-path comparison. Review fix round 1 normalized the expected ADR path as well; the affected relocated fixture then passed all six subcases in the default macOS environment without a TMPDIR override. The exact LoCoMo gitlink `cb5151e32c82c3b6fc6ffdc18e72572691b9d8ea` was initialized; crop/no-key fixtures and print-command ran without live APIs. Existing Vite configuration/deprecation warnings remain.

**Acceptance evidence:** Existing temporary fixtures cover root/child selection, managed writes, referenced no-write, archive privacy, both Task purposes, Task/Run co-moves, scope isolation and aggregate source identities. Actual migrated reads return 5 domain + 98 maintenance Tasks; aggregate site generation returns 103 items in 16 groups and contains no absolute checkout path. Doctor discovers exactly root, evaluation and teaching; no structural errors, but the two pre-existing missing referenced sources remain `.harness/evaluation/.agents/skills` and `teaching/.agents/skills`. Fresh-worktree migration restored only three ignored adopted user indexes, then repeated with zero operations. It still reports `complete: false` for those missing sources; this is not a fully clean instance result.

**Integrity before deliberate memory updates:** 103 Tasks = 101 identical + 2 deterministic link rebases; 52 local memory records = 45 identical + 7 deterministic link rebases; all 100 existing Run logs and 4 assets are byte-identical, with the original 3 absent logs not invented. No old source remains. All 492 originally tracked relative-link targets retain mapped targets. A separate literal Markdown scan recorded 41 unresolved candidates: 33 template/code/historical-plan examples and 8 pre-existing stale Task references in ADRs. ADR 0024’s final architecture Task link is a current decision link reserved for the controller to retarget after final Task state changes, not permanent historical debt. These are disclosed rather than claimed clean; its 593-link inventory uses different exclusions from the controller's initial 2869-reference inventory. Protected posts, gitlink and workspace.json have no unintended changes. Three private indexes and the journal are ignored; no private paths are tracked. Freshly fetched `origin/main` and merge-base were both `0fddb5ad37758a3c54026f21dda7e6a284a53fb5`.

**Current contract reconciliation:** Four existing project memories were updated through `remember`: root README authority, scope-first design/current status, and the two evaluation operational-command entries. The design-stage rationale is retained with an explicit date and current implementation boundary. Only two of these entries belong to the 52-record migration snapshot, so the post-update audit deliberately reports those two differences; the snapshot was not rewritten. A subsequent completed migration remains zero-op and preserves all updates. Root hard-rule wording no longer assumes `.memory`; current evaluation command/cache examples were corrected. Historical reports and protected posts were not rewritten.

**Pending:** Whole-branch controller review, any verified review fixes, final Task/milestone state writes, push and PR #161 update remain unchecked above. No architecture/scope Task was marked done. Other clones still require their own local migration and explicit private ownership/conflict handling; generic Task Skill/MCP CRUD and Python-to-CLI work remain separate backlog. Detailed commands, first-run failures, audit data and changed-file inventory are retained in the worker's local `.superpowers/sdd/2026-10-03-recursive-scope-layout/task-6-report.md` and `task-6-logs/`; these ignored execution artifacts are not public repository content.


**Task 6 review fix round 1:** Evaluation README memory links now resolve inside `.harness/evaluation/.harness/memory/`, preserving the evaluation scope instead of routing readers to root memory. Its smoke README uses current `.harness/memory` vocabulary. ADR 0024 now separates dated pre-implementation discussion from current evidence, retains decision rationale and explicitly incomplete capabilities, and links this verification section; its final Task-state URL remains controller-owned. Only `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s .harness/evaluation/tests -k relocated -v` was rerun: 1 test, all 6 report-location/runner subcases passed under the default `/var/folders/...` TMPDIR. Documentation target checks confirmed both memory links resolve to the evaluation-local namespace and all changed documentation targets exist except the disclosed final Task-state link. `git diff --check` passes; no broad suite was repeated.

**Final whole-branch migration fix wave:** Review reproduced two defects: custom Skill-format types incorrectly moved into the skills module, and existing destination directories could expose private copies protected by restrictive legacy directories. Regression tests first failed for both defects and for unguarded recovery chmod changes. Custom types now default to `memory/<original-directory>`, preserve supported explicit module independently of format, and reject official destination conflicts before mutation. Migration plans retain source and target directory modes; every destination is protected before its first private copy, including existing directories, nested assets, and restrictions formerly supplied by `.memory` ancestors. Stricter existing destinations stay stricter. Recovery rejects later directory-mode changes without replaying files or deleting old sources. Direct instance composition preserves these generic type mappings and effective private restrictions; its existing pending-journal recovery tests still pass.

**Final fix verification:** With `TMPDIR=/private/tmp PYTHONDONTWRITEBYTECODE=1`, generic migration passed 38/38, instance migration 21/21, shared runtime type discovery 15/15 and harness-layout consumers 35/35. These are covering Python checks, not another Node/build run. The first generic run under the default macOS temporary directory also exposed the three already-known `/var` versus `/private/var` fixture assumptions; the canonical TMPDIR run isolated the intended regression failures and all final checks above passed. Custom bodies/assets, identity, unknown metadata, index-only/privacy flags, parent-provided restrictions, before-copy protection, chmod conflict recovery and repeat runs are covered by real filesystem fixtures. No actual Edges instance was migrated in this fix wave. Skill version is 1.0.2; no release tag was created.

**Recovery boundary:** Unfinished old generic journals lack historical directory modes, so the new migrator refuses automatic replay with `journal-directory-permissions-missing`, including old flat-index journals with no directory map. A regression confirms both sides and the journal remain untouched. Completed journals still allow unchanged repeat runs. The Skill and migration guide explain protected local copies, read-only state comparison, trusted permission evidence and recovery in a separate empty directory; they do not authorize deleting the journal or overwriting later edits. Instance journals are separate and their existing recovery remains supported. Controller final review, Task status/link updates, final delivery checkbox, push and PR bookkeeping remain pending.
