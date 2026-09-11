---
name: user_memory_safe_gitignore
description: 如何将 user memory 以安全方式引入 tasks/project-memory 体系，结合 .gitignore 等
metadata:
  edges-type: task
  edges-title: 安全引入 user memory 与 gitignore
  edges-tasks-status: backlog
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: 任务记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-11T09:35:00+08:00"
---

应考虑：如何将 user memory 以安全的方式引入本体系（tasks / project-memory），可结合 `.gitignore` 等手段。

**Why:**
user memory 常含个人偏好、账号侧上下文甚至敏感标识；若直接进可推送的 edges / 业务仓，有泄露与「公开知识库污染」风险。需要明确哪些可入库、哪些仅本地、如何用 ignore / private 仓隔离。

**How to apply:**
- 细聊分层：可公开引用的用户偏好 vs 仅本机/私密仓的 user memory；与 `edges-private`、`.gitignore`、本地 vault 的边界。
- 设计「引入」方式：软链、同步子集、脱敏后投影进 project memory，而不是整包提交。
- 与可扩展 memory type、跨仓协作任务一起定安全默认值（默认不进 git）。
