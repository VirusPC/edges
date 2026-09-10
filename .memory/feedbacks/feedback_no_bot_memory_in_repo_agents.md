---
name: feedback_no_bot_memory_in_repo_agents
description: 改根 AGENTS.md 或 CHANGELOG 时：Grok Bot 共享记忆里的「持久外脑 / 对话记忆只作次级提醒」不要写进仓库；那条只住在 bot 侧。
metadata:
  edges-title: Grok Bot 共享记忆不写进仓内 AGENTS
  edges-type: feedback
  edges-origin-session-id: bc-b539c8ec-4d2f-44a8-930e-01213cfe0f85
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-10T03:51:30+00:00"
---

Grok Bot 共享记忆里的「把 Edges 当持久外脑、对话记忆只作次级提醒」只属于 bot 侧，不要写进仓库的 `AGENTS.md` 硬约束或 `CHANGELOG`。

**Why:** 2026-09-10 peng cheng 纠正 PR #20：这条规则住在 Grok Bot 共享记忆，不是仓内闸门。写进仓库会把 bot 专属工作记忆提升成本仓硬约束。

**How to apply:** 改根 `AGENTS.md` 时不要加这条，也不要在 Unreleased 里记它。大的架构变化必须同变更集更新根 README——那条才是仓内硬约束，保留。
