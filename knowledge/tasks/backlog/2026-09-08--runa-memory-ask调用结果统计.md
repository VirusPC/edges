---
name: runa-memory-ask调用结果统计
description: 为 runa-memory-ask skill 补充「调用后最终结果」统计
metadata:
  edges-type: task
  edges-title: runa-memory-ask 调用结果统计
  edges-tasks-status: backlog
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: Task 记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-10T08:00:00+08:00"
---

runa-memory-ask 已有一定调用量，但缺少对「用户调用完 skill 后，agent 吐回的最终结果」的统计方式；目标是衡量该 skill 在真实业务场景中是否好用。

**Why:**
仅有调用量不够；需要结果侧信号，才能判断 skill 是否真正解决问题。

**How to apply:**
- 设计并落地统计方案：在 skill 被调用后，记录 agent 返回的最终结果（可与既有调用量指标并列）。
- 用这套数据评估 skill 在真实业务中的有效性。
