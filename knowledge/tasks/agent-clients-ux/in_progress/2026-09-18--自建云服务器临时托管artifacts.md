---
name: self_hosted_temp_artifact_hosting
description: 稳定的 artifacts 预览服务（短生命周期托管 + 真浏览器可开 URL）；聊天内嵌预览是绕开的不可靠路径。
metadata:
  edges-type: task
  edges-title: 自建云服务器临时托管 artifacts
  edges-tasks-status: in_progress
  edges-task-project: agent-clients-ux
  edges-task-assignee: Coding 专家
  edges-task-assignee-id: 099e84df-06c3-4c5d-9e29-fc255dce3d56
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: 任务记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-19T14:15:45.781Z"
---

稳定的 artifacts 预览服务（短生命周期托管 + 真浏览器可开 URL）；聊天内嵌预览是绕开的不可靠路径。

**Why:**
Agent artifacts 需要人交互（例如 classifyTasks 审阅页：render-only `review-page` CLI → 本地临时路径）。手机往往没有 localhost / 开发环境。Grok Bot 聊天内嵌 HTML 预览不可靠（手机常无法预览；桌面交互/拖拽会坏，见 `knowledge/notes/2026-09-17--Grok-Bot-HTML预览拖拽异常.md`）。因此自建短生命周期预览托管；与长期站点、以及 backlog「review页结果回传Agent客户端」分开。

**How to apply:**
- 主题与问题框已锁定（2026-09-19 grill，peng cheng）。文档：CONTEXT「Artifacts 预览服务」+ ADR 0013。本轮只定文档，实现等 go-ahead。
- 对照勿并卡：`agent-clients-ux`「数据与视图分离 + 本地 HTML」（本地/仓内视图，不是云临时托管）；`edges-tasks` classify / review-page（只渲 HTML）；backlog「review页结果回传Agent客户端」。
- 与 `site-and-content` 建站/Astro 区分：那是长期内容站。
- 已指派 Coding 专家。看板由任务记录员维护。不改 status。
