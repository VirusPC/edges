---
name: project_memory_scripts_to_edges_cli
description: 把 project-memory-init/remember/ask/doctor 等 Python scripts 迁到 edges CLI
metadata:
  edges-type: task
  edges-title: project-memory 脚本迁到 edges CLI
  edges-tasks-status: backlog
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: 任务记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-17T14:09:11.875Z"
  edges-task-project: edges-cli-platform
---

现有 project-memory-init / remember / ask / doctor 等 Python scripts，后续迁到 edges CLI，与能力面 CLI+Skill+MCP 对齐。

**Why:**
能力面已定为 CLI、Skill、MCP 并列（ADR 0004）；仓根脚本不再是一层。project-memory 还停在 Python scripts，和 `edges` CLI 两套入口。2026-09-13 grill「可扩展 memory type」时 peng cheng 确认要记这条后续，且本轮 memory type **不包含**这次迁移。

**How to apply:**
- 盘点 init / remember / ask / doctor（及同类）脚本，迁成 `edges` 子命令；Skill/MCP 走同一契约。
- 不要在「可扩展 memory type」实现里夹带迁移。
- 对齐 `.memory/projects/project_capability_surface_cli_skill_mcp.md`：禁止新加仓根脚本。
- 未指派。派发时默认先 grill-with-docs。
