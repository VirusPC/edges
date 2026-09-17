---
name: merge_tasks_memory_type_with_board
description: 以后再把 tasks memory type 与 knowledge/tasks 看板语义合并（含 CLI 改造）
metadata:
  edges-type: task
  edges-title: tasks memory type 与看板语义合并（含 CLI 改造）
  edges-tasks-status: backlog
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: 任务记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-17T10:20:00+08:00"
---

以后再把 tasks memory type 做成与 `knowledge/tasks` 看板同语义，并改造 edges tasks CLI。整体复杂，本轮不做。

**Why:**
2026-09-13 grill「可扩展 memory type」时，peng cheng 撤回「本轮就把 tasks memory 做成与看板同语义」。看板仍是 Issue/Run 真相源；本轮可扩展 memory type 只把 `tasks` 当普通种子 type，不碰看板。合并涉及 project-memory 与看板两套模型、以及已落地的 edges tasks CLI，单独排期。


**交叉补记（2026-09-17，classifyTasks grill Q18）：**
Q18=**A**：先做元数据/索引层与 Project Memory 同构（当前 classify / ADR 范围）。**B**=每条 task 收成 memory、tasks 升格为 Memory Type、看板变视图——与本卡同题，**明确以后再考虑**；**不要并进**当前 classifyTasks / ADR 实现范围。本卡继续承载 B 向探讨，不另开「Task 升格为 Memory Type」重复卡。

**How to apply:**
- 等可扩展 memory type 过关后再细聊：合并是同一套文件、一层索引，还是 CLI 把 memory type 映到看板。
- 必含 edges tasks CLI 改造；交叉 `2026-09-13--project-memory脚本迁到edges-CLI.md`，不要两套入口。
- 本轮 memory type 实现禁止改看板真相源、禁止把 status 夹写进 memory type。
- 未指派。派发时默认先 grill-with-docs。
