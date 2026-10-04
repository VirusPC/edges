# Project Memory TypeScript Migration Implementation Plan

> **For agentic workers:** Use subagent-driven-development to execute these tasks with isolated worktrees, test-first implementation, and review before integration.

**Goal:** Replace Project Memory's Python execution layer with TypeScript behind the existing `edges` CLI, preserving the current .harness protocol and source permissions.

**Architecture:** Commander adapters call TypeScript services. Scope/type discovery, index synchronization and filesystem operations belong to services; YAML uses existing gray-matter defaults, not a custom parser. Templates remain canonical Markdown resources and are included in the CLI build. Skills keep the reasoning and human-review workflow and call CLI commands. The separately proposed class-model redesign is not silently declared implemented by this migration.

**Tech Stack:** TypeScript, Node.js >=20, Commander, gray-matter, node:test/tsx.

**Spec:** `extensions/skills/project-memory-init/references/PROTOCOL.md`, `LAYOUT.md`, `frontmatter-fields.md`; current Python operations/tests are behavioral references, not a parser implementation to copy.

## Global Constraints

- All writes happen in isolated worktrees; each agent owns a separate branch/worktree.
- Do not modify knowledge/posts or .obsidian/workspace.json.
- Preserve sparse scope registration, selected types, custom permissions, private gitignore before writes, managed/referenced source boundaries, diagnostics and idempotence.
- Init requires explicit use; remember/doctor never initialize unselected types.
- Ordinary runtime rejects old .memory; only the explicit migrator converts it.
- Preserve user content and unknown metadata; use standard gray-matter defaults and reject non-YAML engines. Do not recreate Python's custom YAML subset.
- Skill resources remain directory-based; this task does not decide a new universal Note/Task folder layout.
- CLI errors and successful operations return machine-readable JSON. --scope selects target; --target-dir remains an explicit migration mapping for existing script callers.
- Do not merge or publish releases. Integration uses the current draft PR branch.

### Task 1: Port core memory services and behavioral tests

**Files:** Create `extensions/cli/src/services/memory/{index,paths,types,templates,blocks,agents,entries,provenance,init,remember,add-type,doctor}.ts` as needed; tests in `extensions/cli/test/memory/`. Read existing Python files under `extensions/skills/project-memory-init/scripts/` and template resources.

**Interfaces:** Export `initMemory(options)`, `rememberMemory(options)`, `addMemoryType(options)`, `doctorMemory(options)` from services/memory/index.ts. Options use camelCase equivalents of Python CLI arguments, with required targetDir; remember accepts content text rather than contentFile. Return current JSON payloads without process IO. Export shared path/type/index helpers for the explicit migrator.

- [ ] Write tests exercising selected init, no-selection nonmutation, remember/index refresh, managed Skill output, referenced rejection, custom private types, doctor readonly/apply/idempotence, source failures, symlink boundaries and nested Git boundaries. Before code exists, run tests and record the expected missing implementation failure.
- [ ] Implement pure document handling with gray-matter and filesystem orchestration in service modules. Preserve unknown metadata when updating an entry. Use UTF-8 decoding that reports invalid source bytes.
- [ ] Run `node --test --import tsx './test/memory/*.test.ts'` in extensions/cli and `tsc --noEmit -p extensions/cli/tsconfig.json` from root; record parity differences caused by standard YAML parsing rather than hiding them.
- [ ] Commit only owned files with a Co-authored-by trailer; provide public exports and test evidence for review.

### Task 2: Port explicit migration and private archives

**Files:** Create `extensions/cli/src/services/memory/migrate.ts` and migration helpers; `archive.ts` for user backup/restore; tests under `extensions/cli/test/memory/` with distinct names. Existing Python references: project-memory-migrate/scripts and user-memory-backup/restore/scripts. Dependency updates only if needed for a maintained archive library.

**Interfaces:** `migrateMemory({targetDir,rootDir?,recursive?,dryRun?})`, `backupUserMemory({repoDir,outputDir?,timestamp?})`, `restoreUserMemory({archive,repoDir,force?})`; preserve JSON result fields and migration journal semantics. Consume Task 1's path/type/index helpers without duplicated ordinary runtime.

- [ ] Write regression tests before porting: readonly dry-run, conflict nonmutation, resume/journal validation, private ignored files and attached resources, nested scope mapping, backup/restore roundtrip, occupied-target refusal, forced replacement, archive traversal/link/duplicate rejection.
- [ ] Port the migration state machine without changing original Markdown bytes except intended indexes/links. Archives must stage and validate before replacement; no shell interpolation or unsafe extraction.
- [ ] Run the new tests, typecheck, and compare representative old/new command results in temporary fixtures. Never use live user data for destructive tests.
- [ ] Commit owned files and provide evidence for review.

### Task 3: Integrate CLI, distribution and skill workflows

**Files:** `extensions/cli/src/memory.ts`, `src/program.ts`, `src/context.ts`, build resource copying, CLI tests/docs; Project Memory and archive SKILL.md/CHANGELOG.md, LAYOUT.md and runtime overview. Remove superseded Python sources/tests after their behavior has TS coverage; update active callers and tooling.

**Interfaces:** `edges memory init|remember|add-type|doctor|migrate|backup|restore`. Common --scope/--target-dir input is resolved before service calls. Preserve doctor --apply, migration --dry-run, archive restore --force, provenance arguments, JSON payloads and nonzero failures.

- [ ] Add a failing end-to-end CLI test through `run(argv, input)` for init/remember and invalid input. Assert generated files and indexes, not internal call counts.
- [ ] Wire commands to services, package canonical templates into dist and verify built CLI runs outside the repository against a temporary scope.
- [ ] Check PROTOCOL unchanged, update LAYOUT commands, then init and remaining non-doctor skills, doctor last. Skills retain reasoning/review gates. Conversation-to-tasks already uses CLI; do not add a second task-writing implementation. Conversation-to-notes publication workflow is a separate change and is not replaced with incompatible ingest output.
- [ ] Replace active script callers, retire Python runtime and obsolete tests, update relevant skill versions/changelogs without publishing tags. Preserve historical ADR/changelog evidence.
- [ ] Run the full CLI tests/build and remaining repository checks affected by removed paths. Review TypeScript changes, address findings, commit and push to the existing draft PR.

## Verification record

Execution evidence and task completion are recorded here as work proceeds.
