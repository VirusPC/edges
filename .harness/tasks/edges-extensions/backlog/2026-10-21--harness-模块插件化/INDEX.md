---
metadata:
  edges-type: task
  edges-task-project: edges-extensions
  edges-updated-at: '2026-10-20T17:29:07.332Z'
  edges-title: .harness 模块插件化
  edges-tasks-status: backlog
  edges-task-priority: none
  edges-task-assignee: 全栈开发专家
name: .harness 模块插件化
description: .harness 下各模块以统一入口与契约可插件化注册与加载，模块间形态一致
---
**背景：**
在做 Compose 改挂（区块与入口 README 融合、去掉虚拟节点、统一 `--exclude`）时，明确目标是保证 `.harness` 下不同模块架构一致，方便后续插件化。当前每个模块本来就有入口 README；Compose 这次改成继承 README 节点、把原虚拟节点能力并进真实 `compose/README.md`，是为插件化铺路，但「模块如何注册成插件、CLI 如何发现与加载」本身还没开卡。要求单独记一张插件化任务卡。
- 相关现状：Compose 改挂实现进行中，方向是模块形态一致、入口 README 可继承定制
- 预期收益：后续给 memory / skills / notes / compose 等按统一契约挂插件，不必再为特例开虚节点
- 非目标：本卡不实现 Compose 改挂本身；不在本卡里拍板插件 API 细节（留给 grill）
- 关联：Compose 改挂到 harness README / 融合入口 README；统一全局 `--exclude`

**目标：**
`.harness` 下各模块以统一入口与契约可插件化注册与加载，模块间形态一致，不再依赖 Compose 式特例。

**前提：**
- 每个模块都有入口 README；定制能力靠继承/特化 README 节点，而不是再发明虚拟节点。
- 架构一致性优先于为单个模块开特例。
- 完成标准与动作细节待 grill-with-docs。

细节 grill 后补。
