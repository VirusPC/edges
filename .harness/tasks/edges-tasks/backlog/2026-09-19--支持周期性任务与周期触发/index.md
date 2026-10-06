---
name: periodic_tasks_and_period_trigger
description: 看板支持周期性任务：按周期触发（cron/间隔等）；与一次性 Task、MQ 派发拆开
metadata:
  edges-type: task
  edges-title: 支持周期性任务与周期触发
  edges-tasks-status: backlog
  edges-task-project: edges-tasks
  edges-updated-at: "2026-09-19T14:44:50.544Z"
---

结论（idea）：edges tasks 看板要支持**周期性任务**，并能按**周期触发**（到点产生/唤醒一次执行或翻出实例）。

**事实背景:**
- 现行 knowledge/tasks 状态机是 backlog|todo|in_progress|… 的一次性 Issue 模型（ADR 0002 / Multica 裁剪）；没有一等公民的「周期定义 → 到点触发」字段或 CLI 动词。
- 已有相近但不同的卡：`按消息队列自动推送就绪task`（就绪即派，不是日历/cron 周期）。
- 平台外已有周期能力（如 Grok Bot routines），与仓内 markdown Task 板不是同一套源。
- 用户 peng cheng 2026-09-19 要求记待办：支持周期性任务、周期触发。

**Why:**
重复性工作若每次手开一张卡，容易漏触发、难对账「这一期做没做」；周期定义应进看板真源，才能和指派、CLI、Skill 同一契约。

**How to apply:**
- grill：周期表达（cron vs 间隔）、模板 Task vs 每期实例、触发后状态/sidecar、与 MQ 自动派发/外部系统绑定的边界、是否复用平台 routine 还是仓内调度。
- 落地面：frontmatter + CLI（create/update/list 过滤）+ 可选触发器；勿与「仅 MQ 派发」并卡。
- 未指派；派发默认 grill-with-docs。
