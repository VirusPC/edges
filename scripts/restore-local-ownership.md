# Restore owner-local memory

This is the reviewed Edges instance correction for the 2026-10-03 owner promotion. It is separate from generic Memory layout migration. Public correction never reads the old instance journal or discovers private records.

Run from the repository root with explicit absolute paths (the package command executes inside `extensions/cli`):

```sh
pnpm restore:local-ownership --root "$PWD" --manifest "$PWD/docs/superpowers/plans/2026-10-05-local-ownership-correction.json" --dry-run
pnpm restore:local-ownership --root "$PWD" --manifest "$PWD/docs/superpowers/plans/2026-10-05-local-ownership-correction.json" --apply
```

The maintained manifest records 43 current public source hashes and reviewed link rewrites, 25 historical type introductions, exact before/after index and graph edits, and the complete managed Skill unit. Historical content supplies ownership and index guidance only. Record bodies use current bytes. Unknown metadata and authored prose remain in the reviewed snapshots. Root additions remain in the root. No private historical index is fabricated or registered by public correction.

Dry-run is read-only. Source drift, changed destinations, changed edited documents, unreviewed Skill resources, and protected or unsafe paths refuse before correction writes. Existing files and Skill directories retain this clone’s actual permissions; manifest modes are defaults only for newly created paths. Recovery snapshots record those actual states, so permission changes after planning are conflicts rather than reasons to widen access. After copying and verifying every output, apply retires the sources. `.ownership-correction/public.json` retains original states for recovery; the directory is ignored and mode 0700, journal mode 0600. Re-run the same command after an interruption; exact copied states are accepted, later edits are refused. Completed repeats are unchanged. Subsequent authored document edits or reviewed manifest revisions advance beyond that snapshot and require review before any rerun; preserve the historical journal rather than editing or deleting it to force a new expected state. This is recoverable multi-file work, not an atomic transaction. Keep the journal and current files when a conflict requires review; do not remove evidence to bypass a diagnostic.

## Private correction is a separate, per-clone opt-in

Do not copy private material or journals between clones. First update this clone's public code and ignore rules, then inspect a dry-run locally:

```sh
pnpm restore:local-ownership --root "$PWD" --private --dry-run
pnpm restore:local-ownership --root "$PWD" --private --apply
```

`--private` is mutually exclusive with `--manifest`. It requires the local completed `.recursive-layout-migration/journal.json`, matching root, safe permissions, original source/type-directory/index evidence, one unambiguous original owner, and exact current file states matching the saved `after` states. Only complete, unmixed private types with all resources accounted for are automatically restored. Custom private types follow the same policy. The corrected owner must have its AGENTS entry already present. That entry gains the actual restored private type; a now-empty root ownership link is removed. Private records and custom type permissions remain private.

All source and destination private directories, both journals, and copy paths must pass effective Git ignore checks before any private bytes are written. Custom private types may need explicit per-owner ignore rules reviewed locally. Public correction does not create these rules or move these records. Private destinations and resource directories receive mode 0700 before copying, files retain owner read/write/execute permissions only; recovery snapshots remain ignored with mode 0600. Only Markdown documents undergo relative-link rebasing; binary and other non-Markdown resources keep their original bytes.

`needs-review` (exit 2) identifies unresolved paths without record bodies. Missing journal/index/directory provenance, merged indexes (`retire`), mixed owners, duplicates, changed current bytes, added assets, occupied targets, or unsupported private symlinks do not trigger guesses or partial movement. Keep the existing journal and sources/destinations for a reviewed local mapping. A private recovery journal supports exact-state resumption and verifies resource membership again. A completed repeat is unchanged.

## Future instance migration and old pending journals

`migrate:recursive-layout` now maps `extensions`, `extensions/skills/project-memory-init`, `shared-extensions`, and `knowledge/notes` to themselves; original `knowledge/tasks` memory belongs to `.harness/tasks`. The canonical ownership manifest records these current mappings and retains the superseded promotion metadata solely as historical evidence.

Pending old journals that would promote a local owner's material into root refuse with `historical-owner-promotion-journal-needs-review`. Keep their journal, original source snapshots, copied destinations, and directory modes for review; do not replay old targets, delete the journal, or treat an incomplete promotion as a completed private correction. Corrected pending journals continue to resume normally.

After public application, run read-only Doctor and representative Memory commands at each restored owner. Missing externally installed referenced Skills are a distinct diagnostic; do not manufacture installations or remove adoption merely to hide them. Full workspace validation and final README/ADR/task reconciliation belong to the integration task.
