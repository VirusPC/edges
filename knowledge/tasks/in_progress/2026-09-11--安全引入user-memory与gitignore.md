---
name: user_memory_safe_gitignore
description: 如何将 user memory 以安全方式引入体系（结合 .gitignore），并考虑仓删后仍留在本机用户目录
metadata:
  edges-type: task
  edges-title: 安全引入 user memory 与 gitignore
  edges-tasks-status: in_progress
  edges-task-assignee: Coding 专家
  edges-task-assignee-id: 099e84df-06c3-4c5d-9e29-fc255dce3d56
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: 任务记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-11T19:21:00+08:00"
---

应考虑：如何将 user memory 以安全的方式引入本体系（tasks / project-memory），可结合 `.gitignore` 等手段；并需评估——仓库删除后，是否仍应保持在本地硬盘（例如用户目录下）。

**Why:**
user memory 常含个人偏好、账号侧上下文甚至敏感标识；若直接进可推送的 edges / 业务仓，有泄露与「公开知识库污染」风险。需要明确哪些可入库、哪些仅本地、如何用 ignore / private 仓隔离。同时，若真相源只挂在仓内路径，`rm -rf` 或换机清仓会把用户侧记忆一并带走，和「知识自主权 / 可迁移」目标冲突——本地用户目录持久化是候选方案。

**How to apply:**
- 细聊分层：可公开引用的用户偏好 vs 仅本机/私密仓的 user memory；与 `edges-private`、`.gitignore`、本地 vault 的边界。
- 设计「引入」方式：软链、同步子集、脱敏后投影进 project memory，而不是整包提交。
- 评估权威副本放用户目录（或 XDG/App 数据目录）时：仓内仅放指针/ignore 规则，删仓不删人；多仓如何共享同一份 user memory。
- 与可扩展 memory type、跨仓协作任务一起定安全默认值（默认不进 git；默认活过仓库生命周期）。
