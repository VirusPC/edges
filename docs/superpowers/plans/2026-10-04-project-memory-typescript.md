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

- [x] Write tests exercising selected init, no-selection nonmutation, remember/index refresh, managed Skill output, referenced rejection, custom private types, doctor readonly/apply/idempotence, source failures, symlink boundaries and nested Git boundaries. Before code exists, run tests and record the expected missing implementation failure.
- [x] Implement pure document handling with gray-matter and filesystem orchestration in service modules. Preserve unknown metadata when updating an entry. Use UTF-8 decoding that reports invalid source bytes.
- [x] Run `node --test --import tsx './test/memory/*.test.ts'` in extensions/cli and `tsc --noEmit -p extensions/cli/tsconfig.json` from root; record parity differences caused by standard YAML parsing rather than hiding them.
- [x] Commit only owned files with a Co-authored-by trailer; provide public exports and test evidence for review.

### Task 2: Port explicit migration and private archives

**Files:** Create `extensions/cli/src/services/memory/migrate.ts` and migration helpers; `archive.ts` for user backup/restore; tests under `extensions/cli/test/memory/` with distinct names. Also port the direct runtime consumer `scripts/migrate-recursive-layout.py` to `scripts/migrate-recursive-layout.mts`, with tests ported from `scripts/test_migrate_recursive_layout.py`. Existing Python references: project-memory-migrate/scripts and user-memory-backup/restore/scripts. Dependency updates only if needed for a maintained archive library.

**Interfaces:** `migrateMemory({targetDir,rootDir?,recursive?,dryRun?})`, `backupUserMemory({repoDir,outputDir?,timestamp?})`, `restoreUserMemory({archive,repoDir,force?})`; preserve JSON result fields and migration journal semantics. Consume Task 1's path/type/index helpers without duplicated ordinary runtime.

- [x] Write regression tests before porting: readonly dry-run, conflict nonmutation, resume/journal validation, private ignored files and attached resources, nested scope mapping, backup/restore roundtrip, occupied-target refusal, forced replacement, archive traversal/link/duplicate rejection.
- [x] Port the migration state machine without changing original Markdown bytes except intended indexes/links. Archives must stage and validate before replacement; no shell interpolation or unsafe extraction.
- [x] Keep the Edges instance migration as a separate repository tool using the generic migration exports. Preserve its reviewed owner map, protected-post hashes, submodule pointers and resume behavior; do not embed Edges business paths in the generic command.
- [x] Run the new tests, typecheck, and compare representative old/new command results in temporary fixtures. Never use live user data for destructive tests.
- [x] Commit owned files and provide evidence for review.

### Task 3: Integrate CLI, distribution and skill workflows

**Files:** `extensions/cli/src/memory.ts`, `src/program.ts`, `src/context.ts`, build resource copying, CLI tests/docs; Project Memory and archive SKILL.md/CHANGELOG.md, LAYOUT.md and runtime overview. Remove superseded Python sources/tests after their behavior has TS coverage; update active callers and tooling.

**Interfaces:** `edges memory init|remember|add-type|doctor|migrate|backup|restore`. Common --scope/--target-dir input is resolved before service calls. Preserve doctor --apply, migration --dry-run, archive restore --force, provenance arguments, JSON payloads and nonzero failures.

- [x] Add a failing end-to-end CLI test through `run(argv, input)` for init/remember and invalid input. Assert generated files and indexes, not internal call counts.
- [x] Wire commands to services, package canonical templates into dist and verify built CLI runs outside the repository against a temporary scope.
- [x] Check PROTOCOL unchanged, update LAYOUT commands, then init and remaining non-doctor skills, doctor last. Skills retain reasoning/review gates. Conversation-to-tasks already uses CLI; do not add a second task-writing implementation. Conversation-to-notes publication workflow is a separate change and is not replaced with incompatible ingest output.
- [x] Replace active script callers, retire Python runtime and obsolete tests, update relevant skill versions/changelogs without publishing tags. Preserve historical ADR/changelog evidence.
- [ ] Run the full CLI tests/build and remaining repository checks affected by removed paths. Review TypeScript changes, address findings, commit and push to the existing draft PR.

## Verification record

2026-10-05: Tasks 1–2 and CLI/distribution/skill integration implemented. Old Python runtime/tests removed after parity verification. Final broad review and draft-PR update remain the final gate.

| Verification | Result |
| --- | --- |
| Baseline before port | Python core/archive102, generic38, instance21 passed. |
| Original acceptance against TS |35 core harness-layout cases and41 migration command-level cases passed; migration executed63 native commands. In-process state/fault cases have native TS equivalents. |
| Final workspace `pnpm test` |579 passed: CLI496, MCP14, artifacts service42, review app27. Includes memory behavior, private archives, migration recovery and isolated compiled distribution. |
| Final workspace `pnpm build` |Passed. Existing Vite `configLoader`/`__dirname` and `inlineDynamicImports` warnings remain in unchanged app configuration. |
| Root script typecheck |Strict NodeNext noEmit check of `scripts/migrate-recursive-layout.mts` passed. |
| Root script CLI |`pnpm migrate:recursive-layout --help` exits0; normal memory adapters covered through CLI integration tests. |
| Source boundaries |No active executable references to removed Python entrypoints; `knowledge/posts/` and `.obsidian/workspace.json` unchanged by this PR. |

Task reviews found and resolved malformed existing YAML overwrite, forged index display rows, forced-restore rollback, bounded archive streams, exact private path ignore coverage, Git-discovery fail-open, resumed gitlink edits and the legitimate interrupted two-entry gitlink state. Regressions use synthetic temporary repositories and archives; no live private migration or restore was performed.

Archive defaults are256 MiB expanded tar bytes and10,000 members, with raw tar/gzip support; backup rejects hardlinked source files. Caught restore failures roll back, but process termination/power loss between directory renames may require the retained private recovery copy. No cross-process lock was introduced.

This completes the execution-language migration, not the separately proposed node class refactor or the pending correction of43 previously promoted local memories. Those remain explicit draft-PR limitations.
