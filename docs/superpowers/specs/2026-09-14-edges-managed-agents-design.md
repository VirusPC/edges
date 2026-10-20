# Edges as Managed Agents — Design Spec

**Date:** 2026-09-14  
**Status:** draft (awaiting human review)  
**Repo:** VirusPC/edges  
**Related:** ADR 0002 (tasks status folders), ADR 0004 (CLI/Skill/MCP), ADR 0005 (edges tasks CLI); Multica Issue/Run model as reference only

## Goal

Make **Edges itself** a managed-agents system: the knowledge loop is primarily operated by managed agents; humans review key decisions. This is not an integration with Multica, Cursor Cloud Agents, or cloud-vendor Managed Agents as the product center.

### v1 success criterion

- Capture and organize (notes/tasks intake, dedupe, dependencies) can be assigned to an agent, approved to start, executed on self-built cloud workers, and written back to the Edges repo with a replayable Run.
- Five human-review gates cannot be self-approved by agents (see Gates).
- Knowledge source of truth remains repo markdown; the cloud is a thin control plane + workers.

### Non-goals (v1)

- Thick Multica-like primary state store for issues
- Automatic dispatch without human start approval
- Research → Edge admission automation
- External publish (posts / public deploy)
- Multi-tenant workspace product
- Claiming/racing daemons
- Merging to `main` without human review

## Constraints (locked in brainstorm)

1. **Product identity:** Edges *is* the managed-agents system (whole-system), not a plugin to another platform.
2. **Human gates (hard):** Edge admission/evolution; external publish; system rules/harness changes; task assignment and whether to start a run; code merge and environment changes.
3. **v1 loop slice:** Capture and organize only.
4. **Runtime:** Self-built cloud capability (fullstack backend), not Grok Bot fleet or Cursor Cloud Agents as the primary executor.
5. **Architecture choice B:** Repo markdown = source of truth; thin cloud control plane for identity / assign / approve / queue; workers execute and write back.

## Architecture

### Three layers

```text
Human (approve assign/start, review PR/results)
        |
        v
┌───────────────────────────────┐
│ Thin cloud control plane      │
│ Agent registry, Gate API,     │
│ Run queue, Projector, Board   │
└───────────────┬───────────────┘
                | lease Run
                v
┌───────────────────────────────┐
│ Cloud workers                 │
│ capture-organize agent loop   │
│ edges note / edges tasks CLI  │
│ Repo Writer (PR by default)   │
└───────────────┬───────────────┘
                | write
                v
┌───────────────────────────────┐
│ Edges repo (source of truth)  │
│ knowledge/notes/              │
│ knowledge/tasks/<status>/     │
│ .{stem}.log.md Run sidecars   │
└───────────────────────────────┘
```

**Conflict rule:** If control-plane projection disagrees with the repo (status folders, files), **reconcile toward the repo**. The DB may cache for UI/speed; it must not become a second knowledge truth.

### Mapping to existing Edges model

| Managed-agents concept | Edges location |
| --- | --- |
| Issue | `knowledge/tasks/<edges-tasks-status>/*.md` |
| Issue status | folder name + frontmatter `edges-tasks-status` |
| Run | sidecar `.{stem}.log.md` (+ control-plane Run record for queue/UI) |
| Agent | Registry entry in control plane (v1); may later mirror into repo config |
| Knowledge capture result | `knowledge/notes/` and/or updated task metadata (not `knowledge/edges/` in v1) |

## Components (v1 minimum)

1. **Agent Registry** — name, role (e.g. `capture-organizer`), `allowed_paths` / `denied_paths`, worker labels, `can_merge=false`.
2. **Assignment + Gate API** — human assigns agent + target material/task; start requires explicit human approve before enqueue.
3. **Run Queue** — states: `pending` → `running` → `completed` | `failed` | `cancelled`. Lease prevents double claim. Align summary fields with Multica-style `runs` / `run-messages` verbs already used in ADR 0005 (read path); append to sidecar remains the execution write path for Run history in-repo.
4. **Worker** — pulls Run; syncs Edges checkout; runs capture/organize procedure; calls `edges note` / `edges tasks` where applicable; reports result.
5. **Repo Writer** — **default: open PR only**; no push to `main`. Controlled push only if later explicitly approved as a privileged path (out of v1).
6. **Projector** — refreshes control-plane views from repo (poll or webhook). Stale marks when sync fails.
7. **Board UI (optional in v1)** — assign, approve start, inspect Runs. API/CLI acceptable without UI for first slice.

## v1 data flow — capture and organize

1. Human (or upstream capture) drops material and/or creates a `backlog` task.
2. Human assigns a capture-organizer agent and **approves start**.
3. Control plane enqueues Run; worker leases it.
4. Worker: interpret material → dedupe/classify → write notes and/or tidy tasks (titles, links, suggested dependencies). Worker must **not** self-promote tasks to `in_progress` or self-start further runs.
5. Repo Writer opens/updates a PR; worker appends a Run attempt line to the sidecar log.
6. Run → `completed` (or `failed`); projector updates; human reviews PR/results.

Candidate Edges (if any insight appears during capture) stay in notes/tasks as **candidates**. Writing `knowledge/edges/`, succession, or archive requires a later gated flow (not v1).

## Human-review gates (enforcement)

Gates are enforced by **API + path/tool policy + writer permissions**, not by prompt trust.

| Gate | v1 enforcement |
| --- | --- |
| Assignment and start | `POST /runs` requires authenticated human approval; agents cannot enqueue themselves |
| Edge admission/evolution | Worker denylist: `knowledge/edges/`, archive/succession operations |
| External publish | Denylist: `knowledge/posts/`, public deploy configs/actions |
| System rules/harness | Denylist: root `AGENTS.md`, hard-constraint memory, default skills/extensions config (privileged run types deferred) |
| Code/environment | `can_merge=false`; no production credentials for infra mutation in v1 worker role |

Short-lived worker tokens are scoped to the single Run’s allowed paths and APIs.

## Error handling

| Case | Behavior |
| --- | --- |
| Worker crash / timeout | Run `failed`; sidecar records attempt; **no auto-retry that mutates the repo**; human may approve a new Run |
| `edges` CLI validation failure (exit 2) | Run `failed` with diagnostics; no blind retry on same bad input |
| Auth / path deny (exit 4 or policy) | Immediate `failed` + alert; no retry |
| Git conflict / stale PR | `failed` or `cancelled`; mark projection stale; human resolves |
| Control plane vs repo drift | Projector reconciles **to repo** |

**Idempotency:** one active lease per `run_id`; sidecar appends are per attempt; never two writers for the same Run.

## Testing (v1)

- Gate unit tests: cannot enqueue without approval; denylist paths always rejected
- Writer contract: produces PR, never pushes `main`
- Capture happy-path fixture: material → expected note/task diff shape
- Reconcile test: manual repo status change updates projection
- Out of scope for v1: multi-tenant load tests, full LLM eval harness (see future Observation/Evaluation tasks)

## Relationship to full-stack work

The self-built cloud control plane + workers **are** the fullstack backend for Edges-as-managed-agents. Frontend board can follow once API contracts stabilize. This subsumes earlier “Tasks local board + edges tasks CLI” leverage as the first product surface on top of the thin control plane, without making the board a second truth.

## Open questions (non-blocking for this draft)

- Exact cloud stack (language, queue, auth) — choose in implementation plan
- Whether Board UI ships in the same milestone as API+worker
- PR target branch naming and bot GitHub identity

## Approval record (brainstorm)

- Path: Architectural
- Approach: **B** (repo SoT + thin cloud)
- §§1–4 design sections approved by peng cheng on 2026-09-14
