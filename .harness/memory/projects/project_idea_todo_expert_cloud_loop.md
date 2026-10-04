---
name: project_idea_todo_expert_cloud_loop
description: >-
  工作流：idea 在领域 tasks/ 或维护 .harness/tasks/ 落卡，经专家细聊、开发、回写 Task 状态；旧
  knowledge/tasks/ 与直推 main 仅是 2026-09-10 历史。
metadata:
  edges-title: idea→task→专家→Cloud Agent→改状态
  edges-type: project
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: codex
  edges-username: cheng
  edges-email: cheng.peng.helloworld@gmail.com
  edges-updated-at: '2026-10-05T05:54:53+08:00'
---

工作模式：idea 记到 Task（Task 记录员）→ 有时间时拿出来细聊（专家 Agent）→ 聊完去开发（Cursor Cloud Agent）→ 开发完后修改 Task 的 edges-tasks-status。

**现行落点（2026-10-05）：**领域工作项归 `tasks/`，Edges 维护工作项归 `.harness/tasks/`；原先的 `knowledge/tasks/backlog/` 与“直接推 main”是 2026-09-10 的旧速记路径及交付约定，不是当前操作指令。看板变更走 `edges tasks`，本仓修改遵守独立 worktree 约束。

**Why:**
把捕获、深聊、实现、收口拆开，避免在记事时硬开开发，也避免聊完没有可追踪的回写点。Task 记录员只负责落盘与状态，不替代专家判断和 Cloud Agent 写码。

**How to apply:**
- 新 idea / 工作项：选择领域或维护板，用 `edges tasks` 追加到对应 Task Project 的 `backlog/`，按当前发布流程交付
- 准备做时：把对应 Task 丢给相关专家 Agent 细聊定方案
- 方案清楚后：用 Cursor Cloud Agent 在目标仓落地
- 合并/验收后：回写该 Task 的 `edges-tasks-status`（并随状态移动分夹）
- 不要跳过落盘直接开干，也不要开发完不改状态
