---
name: memory_types_configurable_deposit_templates
description: 所有 Memory 类型支持按类型配置 remember 使用的沉淀正文模板
metadata:
  edges-type: task
  edges-title: 所有 Memory 类型支持配置沉淀正文模板
  edges-tasks-status: backlog
  edges-task-priority: medium
  edges-task-project: project-memory
  edges-updated-at: "2026-09-24T10:20:03+08:00"
---

所有 Memory 类型都应该支持按类型配置「沉淀」用的正文模板，避免 `remember` 对所有类型套同一套硬编码骨架。

**背景/场景：**

- 【背景/场景】2026-09-24 讨论：记 Task 时套了 `remember` 的「结论→Why→How」骨架，但缺对话场景；进一步厘清 conversation-to-notes（复盘四栏/【背景】）与 `project-memory-remember`（耐久结论）应分开；`skills` 类型正文本来就不套 Why/How。
- 这说明不同 Memory type 的沉淀目的和正文形状并不相同，不能把同一套「结论→Why→How」模板写死给所有类型。

**Why：**

`feedback`、`project`、`reference`、`skills`、`user` 以及通过 `add-type` 增加的自定义类型，各自需要表达的字段和语义不同。模板若只有全局默认骨架，`remember` 会把对话复盘场景、耐久项目结论、技能说明和外部资料卡片混成同一种文档；这既损失类型语义，也会让已有的 `skills` 特殊正文形状变成无法推广的例外。按类型配置沉淀模板，才能让写入格式与类型契约一致，同时保留自定义类型的扩展能力。

**How to apply：**

- 先盘点 `project-memory-remember` 当前按 type 生成正文的逻辑，以及各官方类型的实际正文需求；明确本任务实现范围仍 TBD，不在本 backlog 卡里预先锁死方案。
- 设计每个 Memory type 的沉淀正文模板契约：至少覆盖 `feedback` / `project` / `reference` / `skills` / `user`，并让 `add-type` 登记的自定义类型也能配置自己的模板，而不是退回唯一全局模板。
- 对照评估配置放在哪里：类型定义、类型目录的 `AGENTS.md`、模板目录，或它们的组合；重点确认 `TYPE.tmpl`、`PROTOCOL`、`remember` 的发现与优先级如何保持一致。
- 明确缺省模板、模板变量、旧条目的兼容策略和测试/文档验收标准；保留 `skills` 已有的不同 body shape 作为必须覆盖的回归场景。
- 当前状态：backlog，未指派；派发实现前先 **grill-with-docs**。

**非目标：**

- 不在本文件中实现 conversation-to-tasks；这是另一个独立想法。
- 不在本任务中修改 notes skill；conversation-to-notes 的复盘四栏/【背景】边界另行处理。

**关联：**

- `extensions/skills/project-memory-remember/SKILL.md`
- `extensions/skills/project-memory-init` 的 `TYPE.tmpl` / `PROTOCOL`
- `project-memory-add-type`（`add-type`）及其自定义 Memory type 发现机制
- `skills` 类型已经存在的特殊正文形状
