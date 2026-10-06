---
metadata:
  edges-type: task
  edges-task-project: project-memory
  edges-updated-at: '2026-10-06T16:21:19.042Z'
  edges-title: project harness init skill
  edges-tasks-status: backlog
  edges-task-priority: medium
name: project_harness_init_skill
description: 把系统入口初始化做成 project harness init（演进或包装 project-memory-init），供用户对任意选定目录自行 init。
---
## 背景

节点模型 grill（2026-10-06）确认：任意目录都可由用户自行初始化真实系统入口 `AGENTS.md`（带组成登记），以标记该目录为重点维护的系统二作用域。现有 `$project-memory-init` 名称与「只做 memory」心智仍偏旧；需要明确的 **project harness init** 能力（演进现 skill 或新 skill），供用户对选定目录调用。

## 目标

用户能对任意选定目录调用 project harness init（Skill + 底层 CLI 合同与现网一致），生成/刷新系统入口 `AGENTS.md`（硬约束种子 + 组成区块），而不强制每个目录都有入口。

## 动作

- grill / 设计：init 与 project-memory-init 的关系（改名、包装、还是并存）
- 实现 Skill（及必要 CLI）与文档
- 与根 README entries、`--super` 虚拟超节点个人查询对齐验收

## 完成标准

- 用户对空目录或已有目录执行 init 后得到合法系统入口
- 文档写清「谁该 init、谁不该」
- 不自动给所有目录铺 AGENTS.md
