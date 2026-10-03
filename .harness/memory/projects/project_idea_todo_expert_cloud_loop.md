---
name: project_idea_todo_expert_cloud_loop
description: 工作流：idea 记到 knowledge/tasks（Task 记录员）→ 有空时专家 Agent 细聊 → Cursor Cloud Agent 开发 → 开发完改 Task 状态
metadata:
  edges-title: idea→task→专家→Cloud Agent→改状态
  edges-type: project
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: Task 记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-10T08:00:53+00:00"
---

工作模式：idea 记到 Task（Task 记录员）→ 有时间时拿出来细聊（专家 Agent）→ 聊完去开发（Cursor Cloud Agent）→ 开发完后修改 Task 的 edges-tasks-status。

**Why:**
把捕获、深聊、实现、收口拆开，避免在记事时硬开开发，也避免聊完没有可追踪的回写点。Task 记录员只负责落盘与状态，不替代专家判断和 Cloud Agent 写码。

**How to apply:**
- 新 idea / 工作项：交给 Task 记录员，追加到 `knowledge/tasks/backlog/`，直接推 main
- 准备做时：把对应 Task 丢给相关专家 Agent 细聊定方案
- 方案清楚后：用 Cursor Cloud Agent 在目标仓落地
- 合并/验收后：回写该 Task 的 `edges-tasks-status`（并随状态移动分夹）
- 不要跳过落盘直接开干，也不要开发完不改状态
