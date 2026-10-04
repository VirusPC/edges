# Recursive Node Ownership Correction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the user's corrections to recursive AGENTS organization and restore local memory ownership without losing subsequent edits or private boundaries.

**Architecture:** Uniform node reading replaces the obsolete independent-responsibility gate. Existing AGENTS keep the three Project Memory sections; type and business indexes retain their content contracts through explicit local/descendant registration. A reviewed, deterministic correction map restores current public records and original manual index guidance, while the instance migrator preserves equivalent ownership for future/private migrations.

**Tech Stack:** TypeScript CLI models/services, filesystem Markdown, Git, node:test/tsx.

**Spec:** `docs/adr/0024-scope-first-content-ownership.md`, current README recursive-tree principle and `docs/superpowers/specs/2026-10-04-node-domain-model-design.md`.

## Global Constraints

- Execute after the node-domain model plan. Do not re-execute the historical directory migration plan or consider its checked boxes current approval of the corrected ownership.
- Isolated worktrees only. Never edit knowledge/posts or .obsidian/workspace.json. No private content fetched from other clones/worktrees, no merge/deployment/release/automatic directory-review schedule.
- AGENTS remains three parts: 本层硬约束 (alias 本层重要约束), 本层记忆, 下层记忆索引. Tasks and other module references fit the existing parts; no separate 工作与模块入口.
- No independent-goals/decisions/validation eligibility gate. Real directories with a readable AGENTS are nodes; CLI selects the explicit scope or nearest AGENTS with Git fallback when none exists. This is initial CLI discovery policy, not inference of logical parent from dirname. Explicit scope still does not initialize Memory automatically.
- The43 promoted public records return to original owners: extensions16, extensions/skills/project-memory-init17, shared-extensions1, knowledge/notes1, old knowledge/tasks8 now .harness/tasks. Domain tasks reference the board-maintenance conventions rather than duplicating them.
- Restore using current source bytes. Historical Git supplies original owner and manual index sections only. Preserve all current root records, unknown metadata, subsequent edits, private flags and current paths of actual source code/docs.
- Private copies/archives/journals must remain ignored before writing. Other clones retain their private data and receive a deterministic documented upgrade path; don't claim live migration there.
- Keep fixed CONTEXT/docs/ADR/Skill locations; use references. Keep memory/skills containers optional with type-level AGENTS and managed/referenced distinction.

### Task 1: Uniform node selection and three-part discovery

**Files:** `extensions/cli/src/utils/scope.ts`, normal Memory scope/index helpers, AGENTS syntax/model helpers as necessary, Task project index generators, `scripts/migrate-recursive-layout.mts`, PROTOCOL/LAYOUT and corresponding Skill docs/tests.

**Interfaces:** Current --scope/env/cwd precedence unchanged. Remove only the marker/independent-responsibility eligibility predicate. Domain command semantics remain explicit; adopt/init and writable types still require registered content contracts. Project/task/type indexes may have a sparse representation of the same content model, without requiring empty headings or auto-creating all modules.

- [ ] Add failing temporary-file tests for an unmarked AGENTS node, nested type/business entry, explicit target without init, local vs descendant traversal and cross-directory registered references. Verify valid authored extra prose survives while newly generated organization is only three-part.
- [ ] Make node identification consume common model/service. Update source generators to register modules in local or descendant based on actual logical ownership. Keep task-project marker-owned list inside the existing local section, preserving business metadata and non-index prose; no duplicate index listing.
- [ ] Update protocol statements that retained the rejected eligibility gate; retain sparse explicit adoption, type permissions and cross-layer direct links. Upgrade changed Skill versions/changelogs without publishing tags. Do not rewrite historical examples as current facts.
- [ ] Run scope/model/memory/task-project and migrator tests affected by changed predicates/entry output; commit and report exact evidence.

### Task 2: Restore current public records and correct future migration ownership

**Files:** The43 current root record sources and owner-local targets, root/five local AGENTS/type indexes, current callers linking moved records; `docs/superpowers/plans/2026-10-03-recursive-scope-ownership.json`, instance migrator owner map or replacement current mapping, correction tool/tests. Read-only input audit `restore-audit.md/json` prepared during node-domain plan; promote the non-sensitive mapping to a maintained correction manifest before cleanup.

**Interfaces:** Provide explicit dry-run/apply correction entry through existing repository maintenance command pattern. Source/current SHA and exact relative path pairs are recorded. A second completed run is no-op; changed destinations or unexpected source drift refuse without overwriting. No guess based on titles and no unchanged historical SHA used to replace later bytes.

- [ ] Write failing fixture with a root record changed after original migration, independent root additions, original custom type-index guidance, relative links and an occupied conflicting target. Assert readonly dry-run, latest bytes preserved on apply, manual index text restored, root additions intact, conflict nonmutation and repeat no-op.
- [ ] Materialize audited mappings from existing migration manifest plus current source hashes. Extract the25 original public type-index introductions from `18be461^`, convert only metadata/type/path contracts, and regenerate entries with current CLI/model operations. Root indexes lose only moved entries and recognized migration appendices; preserve unrelated current prose.
- [ ] Fix both future instance `OWNER_MAP` and private owner mapping. Ensure new migrations from old layout put each scope's memories locally and upgraded clones don't re-promote records. Extend resume/journal tests; retain established ignore and gitlink guarantees. Update the current canonical migration mapping coherently while preserving historical audit evidence.
- [ ] Execute reviewed public correction in integration worktree only after fixture review. Update active links to moved records, root and owner AGENTS graph, and cross-reference domain tasks to shared board conventions. Restore paths/entry indexes together. Verify every recorded byte/hash/link transformation; protected posts remain untouched. Private correction remains opt-in per clone, with explicit conflict handling.
- [ ] Run doctor readonly on restored scopes, distinguish preexisting unavailable referenced installs from actual broken restored indexes, and test current commands against representative restored public owners. Commit and report.

### Task 3: Reconcile design, plan, task and operational documentation

**Files:** README, CONTEXT, ADR0024, both current specs and plans' status summaries, active migration guide, relevant current Task status via CLI, project memory via CLI, existing draft PR body.

- [ ] Update current-state descriptions and old-path active references. Preserve dated historical plan evidence under explicit superseded-state notes; no global string replacement. Confirm all previously listed user corrections have a concrete implemented artifact/test or explicitly unresolved decision.
- [ ] Run final workspace tests/build and strict root migration typecheck after code changes; read-only protected-path diff and public current-link verification. Review whole current change range; address findings, summarize remaining limits honestly.
- [ ] Record tested architecture and restored ownership, update plan/task status only for actually completed objectives, commit/push existing PR. Do not mark broader unsupported agent-team/RSI automation as implemented merely from directory organization.
