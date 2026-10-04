# Node Domain Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved node classes and NodeService, connect real CLI consumers, and support document/resource ownership without losing existing content or command behavior.

**Architecture:** Six domain classes live together in `extensions/cli/src/models/`. Instance parsing and serialization share standard gray-matter primitives; InternalNode delegates syntax preservation to private model helpers. A common asynchronous NodeService coordinates filesystem persistence, local/descendant traversal and ownership indexes. Existing business workflows consume these models/services rather than introducing another independent tree implementation.

**Tech Stack:** TypeScript, NodeNext, existing gray-matter and CommonMark libraries, node:test/tsx, pnpm.

**Spec:** `docs/superpowers/specs/2026-10-04-node-domain-model-design.md`. Follow the current user-confirmed specification, not earlier completed plans' obsolete architecture. Structural ownership correction follows ADR0024 and will have its own subsequent implementation plan.

## Global Constraints

- Work only in isolated worktrees on independent branches. Preserve other agents' edits. Do not modify knowledge/posts or .obsidian/workspace.json.
- BaseNode, InternalNode, TaskNode, MemoryNode, NoteNode and SkillNode share optional parent/children, required absolute path, readonly type/path/id, optional YAML metadata and body. Instance parse/serialize; no model filesystem IO.
- Parent/children and index entries share NodeReference; children require local/descendant kind, ordinary/parent references may omit it. No NodeTree class or parallel mutable index representation.
- AGENTS keeps exactly the original three sections. InternalNode derives children from local/descendant indexes, including all directly indexed document types. Cross-directory links are supported; physical dirname does not establish parent.
- NodeService exposes create/get/list/update/destroy and attach/detach/reparent as specified. list defaults to local recursion and filters before reading; reparent changes ownership, not location. Independent get does not fabricate parent.
- Standard gray-matter defaults only; no new YAML engine/schema/comment-style preservation. Reuse existing Markdown syntax helpers where needed to preserve authored non-index content.
- Existing Task fields/status/project/runlog, Memory permissions/private Git-ignore-before-write, Note Git/PR behavior and referenced Skill read-only boundaries remain intact. New abstractions must be used by production consumers, not only tests.
- The design discussions also require single-file and directory-entry support for ordinary content; ordinary directory entries use index.md and Skills use SKILL.md; see the spec addition before Task4. Skill is the complete SKILL.md directory; resources are not logical child nodes. Do not bulk convert existing content or infer directory ownership from arbitrary sibling assets.
- No deployment, release, merge, external Skill installation, new scheduling, or private material copied from other worktrees. Continue the existing draft PR.

### Task 1: Domain classes and instance document behavior

**Files:** Create `extensions/cli/src/models/{base-node,internal-node,task-node,memory-node,note-node,skill-node,types,index}.ts` and focused private helpers if needed; tests `extensions/cli/test/models/*.test.ts`. Existing syntax source: `src/utils/node-tree/{model,codec/*}.ts`; business field sources: `src/tasks/utils/frontmatter.ts`, `types.ts`, `src/services/memory/documents.ts`.

**Interfaces:** Implement the public types/classes exactly as in the spec's Public Types section. Constructors accept path only and never invoke overridable parsers. Base type is `base`; Internal type is `internal`. `parse(markdown):this`, `serialize():string`, protected parseBody/serializeBody. Concrete type must remain readonly. Implement model relation coordination through a package-internal helper used later by NodeService; do not expose public writable parent/children setters. Export only types/classes needed by consumers.

- [ ] Add failing tests showing model behavior before implementation. Example:
```ts
const node = new TaskNode('/scope/tasks/one.md');
node.parse('---\nname: one\nmetadata:\n  edges-title: Before\n  edges-tasks-status: todo\n  vendor: keep\n---\nBody\n');
node.title = 'After';
assert.equal(new TaskNode(node.path).parse(node.serialize()).title, 'After');
assert.equal(node.metadata?.metadata && (node.metadata.metadata as Record<string,unknown>).vendor, 'keep');
```
Also verify optional headers, subclass hooks, repeated parse reset, no path/tree context leaked into YAML, nested metadata snapshots cannot mutate state, invalid status/priority rejects before mutation, Note H1 title updates body, Skill name/description follow frontmatter, no-header base document, and invalid non-YAML language rejection.
- [ ] Implement BaseNode with cloned metadata/read-only snapshots and protected body extension points; keep fields' canonical storage in metadata/body. Reuse existing business field names and validity, not new schemas. setMetadata/removeMetadata address outer metadata keys; reject invalid domain metadata through domain hooks.
- [ ] Implement InternalNode using current Markdown parser/serializer as a private syntax helper, preserving authored non-index prose and section headings. Map each actual indexed link to NodeReference with label/description and derived kind. Implement setConstraints/addChild/updateChild/removeChild; updateChild requires existing target, replaces optional values, can change kind, cannot rename target. Escape generated display text and encode paths consistently. Plain references never become children. Existing type indexes with project-memory-entries map to local references and retain their existing header/body syntax; they do not acquire a new physical intermediate directory or forced extra chapters. InternalNode body getter/serialize use current content; parse/body setter replace state rather than append. Parent/children optional on other classes.
- [ ] Run `node --test --import tsx './test/models/*.test.ts'` from CLI and root `pnpm exec tsc --noEmit -p extensions/cli/tsconfig.json`. Commit only owned classes/tests; report exact RED/GREEN evidence, exports and constraints.

### Task 2: Common NodeService persistence and ownership traversal

**Files:** Create `extensions/cli/src/services/{node-service,traverse}.ts`, narrow persistence helpers as needed, tests `extensions/cli/test/services/node-service*.test.ts`; may extend Task1's internal relation helper. Reuse proven `utils/node-tree/filesystem.ts` identity/symlink handling; no duplicate Markdown model.

**Interfaces:** `new NodeService()` and asynchronous methods from spec; overload get(path, Model?), returns undefined only for absent target. list(scopePath,{includeDescendants?}) returns BaseNode[]; accepts a directory scope, reads its AGENTS.md. Public path args absolute. InternalNode for AGENTS; Task/Memory/Note/Skill constructors selected from explicit index/module contracts, not arbitrary YAML guessing. Type-index entries are local children without pretending they have new handwritten AGENTS sections. Keep literal references unmodified in documents; resolve relative to owning entry.

- [ ] Write failing actual-filesystem tests, including:
```ts
const root = new InternalNode(scope + '/AGENTS.md').parse(rootSource);
await service.create(root);
const task = new TaskNode(scope + '/tasks/one.md').parse(taskSource);
await service.create(task, { parent: root, kind: 'local' });
assert.equal((await service.get(task.path, TaskNode))?.title, task.title);
assert.deepEqual((await service.list(scope)).map(n => n.path), [root.path, task.path]);
```
Cover local index chains of arbitrary depth, skip unreadable/missing descendants before load unless includeDescendants, explicit included missing targets error, missing get undefined, stable preorder/dedup, cycle refusal, cross-directory references, child.parent after attachment, get without fabricated parent, and all create/update/destroy failure contracts.
- [ ] Implement safe reads and same-directory file replacement with source/identity checks and modes, no model IO. New create refuses existing targets; update refuses missing/stale/substituted files. Resolve reference links and fragment/encoding with existing path helpers. Validate public paths and filesystem symlink boundaries. Preserve existing source read-only/private policies in adapters; provide a narrow explicit policy hook only if production integration requires it, document it before integration.
- [ ] Implement attach/detach/reparent and update InternalNode index consistency, including reciprocal state of loaded nodes. Preflight all writes before mutation; on multi-file failure report concrete affected paths and retain/recover old files rather than claiming transaction atomicity. Reject self-ownership/cycles and conflicting known parent; destroy rejects nodes with ownership children and preserves unknown external refs. The persistent indexes remain truth, not a global singleton cache.
- [ ] Run NodeService/model tests and CLI typecheck; commit and report. Do not change all CLI adapters yet.

### Task 3: Production consumers and source organization

**Files:** CLI command consumers, `src/utils/node-tree/`, Task and Memory document services, Note service, tests for CLI integration; CLI README and node spec current-state note.

**Interfaces:** Preserve existing command arguments/results/exit codes while replacing internal domain parsing/mutation with the models and NodeService. Existing low-level public helpers may remain only as thin adapters used by external callers/tests; remove redundant pure-data tree orchestration that production no longer needs. Keep common primitive document formatting under utils; model-specific syntax helpers belong under models.

- [ ] Add integration regressions that exercise real memory remember/index, tasks create/update/status, and scope selection with the new model behavior. Preserve errors/output/provenance/runlogs and private preflight. Verify typed fields preserve unknown vendor metadata. Before edits, show a user-visible missing new behavior failing, not a mock-call assertion.
- [ ] Thread explicit scope into NodeService and migrate actual domain operations to models. Public file persistence uses NodeService where appropriate; archive/migration remain separate batch workflows and do not serialize every historical document. Memory service retains permissions/type layout orchestration, Task service retains board/status movement, Note service retains Git/PR publishing. The normal runtime must not import legacy migration.
- [ ] Organize model classes together and services separately as spec. Move command handlers under src/commands while retaining the directory-as-command-tree mechanism; update runtime/script/test imports and emitted asset paths in the same task, without compatibility copies. Move model-specific syntax helpers under models, retain only generic Markdown/filesystem primitives in utils, and make previous public pure-data model APIs internal adapters or remove them when unused. Business orchestration belongs under services; command-specific rendering/argument helpers may remain with commands. Do not introduce a new package or duplicate commands.
- [ ] Run changed integration/model/service tests, full CLI tests and build. Update API docs to distinguish live implementation from remaining resource/ownership work. Commit and report.

### Task 4: File and directory entries with owned resources

**Files:** Extend models/services with entry layout detection and directory resource ownership; Task/Memory/Note create/read/move/index paths and tests; Skill service boundaries; spec and current layout docs.

**Interfaces:** AGENTS references always target an entry file. Ordinary docs support existing single .md and a named entry in an owned directory; Skill always uses SKILL.md. Entry names are index.md for Task/Memory/Note and SKILL.md for Skill, recorded in the spec; no automatic whole-directory ownership for BaseNode or InternalNode. Expose readonly directoryPath for owned resource directories, undefined for standalone docs and InternalNode. Directory ownership is determined by the explicit entry contract, never just dirname of any md. A directory may contain arbitrary resources; they are not inferred children.

- [ ] Record chosen entry naming and lifetime rules in spec. Add failing tests for loading referenced single vs directory entries, preserving assets when updating body, safe whole-unit moves/deletion, standalone sibling assets left untouched, and Skill full-directory ownership without treating scripts/images as child nodes.
- [ ] Implement layout-aware service persistence using those tests. get still accepts entry path, indexes keep entry paths; no recursive scan to guess entry from arbitrary siblings. Destroy of an owned unit affects its own resources, never referenced external paths or logical descendant units. Retain permissions and known-readonly source boundaries; reject ambiguous/non-owned destructive targets.
- [ ] Expose explicit opt-in `--format file|directory` for new Memory/Task/Note output, default file preserves existing callers. Skill remains directory-only. Existing directory entries are readable/updateable/indexable; Task status transitions move the unit including its runlog/resources. Note/Memory imports reference colocated assets. Do not bulk convert existing notes/tasks/memories.
- [ ] Run focused layout/CLI tests and model/service tests; commit and report exact scope. If conversation-to-notes needs a deterministic body-preserving CLI ingest flag, implement it here without replacing the Skill's writing/review workflow; conversation-to-tasks retains its existing CLI path.

### Task 5: Validation, records and delivery

**Files:** Node spec, plan checkboxes/evidence, CLI README, root changelog, existing draft PR body; appropriate project memory via CLI.

- [ ] Run workspace tests/build and standalone root-script typecheck affected by imports. Confirm no diff under knowledge/posts or .obsidian/workspace.json. Test built CLI from outside checkout with a temporary explicit scope.
- [ ] Review all task diffs and final cross-change integration; address concrete findings and keep repeated checks scoped. Record any not-yet-implemented separate ownership correction visibly rather than rewriting historical plan completion.
- [ ] Update spec's implementation status with concrete paths, keep future directory/ownership limitations accurate, and persist reusable decisions through project-memory-remember. Push current draft PR, no merge/deploy/release.

## Next independent plan

After completing this model plan, execute the previously confirmed structural corrections under a separate plan: restore local memories to original owners with current bytes preserved; fix instance privateOwnerMap; restore three-part AGENTS registration; remove extra responsibility eligibility; update documentation and migration output together. This ordering keeps domain code and physical content correction independently verifiable. Original Tasks-scope context maps to the maintenance board owning its infrastructure rules, with domain tasks referencing that source as needed rather than duplicating it; verify individual records before moving. No private material is fetched from other checkouts.
