---
name: feedback_capability_surface_three_peers
description: 写能力面标题、Why、How-to 时：三者并列；禁止「必要时 MCP」、禁止用「一个 CLI + 一份 skill」当本仓简称。
metadata:
  edges-title: 能力面必须 CLI / Skill / MCP 并列
  edges-type: feedback
  edges-origin-session-id: bc-5d1f4bf4-8857-4d1f-bfcd-1737a61fe922
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-11T15:32:36+00:00"
---

写能力面时必须把 CLI、Skill、MCP 三者并列。标题、Why、How-to 都不得把 MCP 写成「必要时」可选项，也不得用「一个 CLI + 一份 skill」当本仓能力面的简称。

**Why:**
2026-09-11 peng cheng 纠正 PR #42：项目记忆标题仍写成 bin/CLI/Skill，How-to 写「必要时 MCP」，Why 以「一个 CLI + 一份 skill」起笔，等于把 MCP 降成加装层。经典项目只示范 CLI 与 Skill 的形状；Edges 的能力面定义始终是三条入口。某一功能明天可能还不需要单独的 MCP server，但表面模型必须一直点名三者。

**How to apply:**
- 记忆标题用「能力面：CLI / Skill / MCP」这类三者并列，不要 `bin / CLI / Skill`。
- Why 先写三条对等入口；经典项目对照只能解释 CLI+Skill 形状，并写明 MCP 是无 shell 宿主的一等入口。
- How-to 写「CLI 契约 + Skill 说明 + MCP 暴露」；禁止「必要时 MCP」。需要机器入口时一并提供。
- CONTEXT / ADR / 计划里的 Skill 文案把 MCP 写成对等能力面入口，不要写成脚注或 fallback。
