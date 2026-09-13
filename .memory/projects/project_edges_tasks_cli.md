---
name: project_edges_tasks_cli
description: 本轮 edges tasks 看板操作只做 CLI（list/get/create/update/status + 只读 runs/run-messages）；Skill 与 MCP 后做同一契约。决策见 ADR 0005。
metadata:
  edges-title: edges tasks 本轮只做 CLI
  edges-type: project
  edges-origin-session-id: bc-2363844d-2722-4848-a16f-31c182b56c7f
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-13T03:19:32+00:00"
---

本轮 `edges tasks` 只做看板 CLI，不实现 Skill / MCP，也不抄 Multica daemon。命令为 `list|get|create|update|status|runs|run-messages`；取消走 `status cancelled`；GitHub 关联本轮不做；Run 层只读 sidecar，稳定 `run-id`，动词用 `runs` / `run-messages`。决策见 ADR 0005。

**Why:**
2026-09-13 grill 确认：先把 CLI 契约钉死，Skill 与 MCP 后做同一契约；能力面仍是 CLI + Skill + MCP 三者并列。对照 Multica Issue/Run 双层（https://multica.ai/docs/cli 、https://github.com/multica-ai/multica/blob/main/CLI_AND_DAEMON.md 、https://github.com/multica-ai/multica-cli 、https://github.com/multica-ai/multica/pull/314），仓内落盘是 `.{stem}.log.md`，不是 daemon 调度。

**How to apply:**
- 实现 CLI 时按 ADR 0005 与 CONTEXT 术语，不要先写 Skill/MCP，不要硬删，不要本轮 append。
- 对照细节打开 `.memory/references/reference_multica_cli_tasks_reference.md`。
- 不要把 Run 状态写成 `edges-tasks-status`，不要用行号当长期主键，不要自造 `log` 动词。
