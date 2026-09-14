---
name: reference_multica_cli_tasks_reference
description: 设计 edges tasks CLI 时对照 Multica：https://multica.ai/docs/cli ；指南 https://github.com/multica-ai/multica/blob/main/CLI_AND_DAEMON.md ；skill https://github.com/multica-ai/multica-cli ；runs PR https://github.com/multica-ai/multica/pull/314
metadata:
  edges-title: Multica CLI（Issue/Run）对照链接
  edges-type: reference
  edges-origin-session-id: bc-536a7aef-3cd1-434b-a51e-c1be77a9b2eb
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-13T02:51:33+00:00"
---

设计 `edges tasks` 时对照 Multica 官方 CLI（Issue / Run 双层）。

**Links:**
- Docs: https://multica.ai/docs/cli
- CLI+Daemon guide: https://github.com/multica-ai/multica/blob/main/CLI_AND_DAEMON.md
- Agent-oriented skill repo: https://github.com/multica-ai/multica-cli
- runs / run-messages CLI PR: https://github.com/multica-ai/multica/pull/314

**Commands (relevant):**
- `multica issue list|get|create|update|status`
- `multica issue runs <issue-id>` — list executions for an issue
- `multica issue run-messages <task-id>` — message stream for one run (`--since` supported)
- No top-level `log` verb; daemon logs are separate (`multica daemon logs`)

**Why:**
edges Task Run Log（`.{stem}.log.md`）概念对齐 Multica Run，但落盘是仓内 sidecar；CLI 动词应优先用 `runs` / `run-messages`，不要自造 `log`。

**How to apply:**
- 设计/实现 `edges tasks` 时打开上述链接核对
- 本轮 grill：Issue 层 list/get/create/update/status；Run 层 runs + run-messages（读写范围另定）
