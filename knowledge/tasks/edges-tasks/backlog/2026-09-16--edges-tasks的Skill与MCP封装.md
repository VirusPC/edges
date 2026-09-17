---
name: edges_tasks_skill_mcp_wrappers
description: 在现有 edges tasks CLI 契约上补 Skill 与 MCP；不另造动词
metadata:
  edges-type: task
  edges-title: edges tasks 的 Skill + MCP 封装
  edges-tasks-status: backlog
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: 任务记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-17T14:09:13.020Z"
  edges-task-project: edges-tasks
---

在现有 `edges tasks` CLI 契约上补 **Skill** 与 **MCP** 封装，三者共用同一套动词与语义；不要另造一套操作面。

**Why / 结论:**
ADR 0005（tasks CLI）与 ADR 0009（Project 分组，#69）落地的是 **CLI + 看板路径**。能力面仍按 ADR 0004：CLI + Skill + MCP **三者并列**；Skill / MCP 按同一契约后做。#15「tasks 配套 skill」已 done，但是早期 CRUD skill 路径；本条是在 **现行 CLI 契约**（含 Project / `_default`、priority 等）上把 Skill 与 MCP 对齐补齐，而不是重开一套命令。

**How to apply:**
- 以现行 `edges tasks` CLI 为真源契约：list/get/create/update/status、runs 只读等；Skill 与 MCP 做薄封装，动词不另造。
- **不包含：** Multica daemon、parent/sub-issue/stage、本条不重做 GitHub 关联（见独立 backlog）。
- 交叉：`CLI与MCP需加鉴权`、`conversation-to-task-skill调用CLI`、已 done 的 #15 skill 与 ADR 0005/0009。
- 派发时默认先 grill-with-docs。
