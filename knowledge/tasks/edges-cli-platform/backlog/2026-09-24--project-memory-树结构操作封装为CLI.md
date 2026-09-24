---
name: project_memory_tree_operations_as_cli
description: 将 project-memory 的树结构操作（至少含找最近父节点）封装成 edges CLI，避免散落在 skill 或脚本里
metadata:
  edges-type: task
  edges-title: project-memory 树结构操作封装为 CLI
  edges-tasks-status: backlog
  edges-task-priority: medium
  edges-updated-at: "2026-09-24T01:43:00.795Z"
  edges-task-project: edges-cli-platform
---

把 project-memory 的树结构操作（至少含「找最近父节点」）封装成 CLI，不要让这类能力散落在 Skill / Python script 里。

**Why:**

树上的父子关系、路径定位与节点操作是 project-memory 的底层能力；统一进入 CLI，才能让 Skill、脚本和其它调用方复用同一份契约，避免各自实现后语义漂移。

**How to apply:**

- **Scope TBD：** 先盘点并确定子命令集合，至少覆盖「找最近父节点」，再决定是否纳入遍历、挂载、剪枝、搬迁及节点增删改查等树操作。
- **实现位置倾向：** 放进现有 `edges` CLI（likely `extensions/clis` / 对应 edges CLI package），不要新增并列入口或继续堆仓根脚本。
- 对照已有 project-memory skills/tools 与 `project-memory-init / remember / ask / doctor` 等入口，明确哪些只是调用层、哪些下沉为 CLI 的稳定契约；避免重复造树操作。
- 与 backlog「reshape 底层拆树原子操作」对齐：底层原子能力与 CLI 命令边界分别定义，reshape 可组合 CLI 之下的实现，而不是把实现散落到 Skill。
- **状态：** backlog；未指派。
- 派发实现前默认先 grill-with-docs，先补齐现有协议、ADR、Skill/工具契约与子命令设计，再编码。
