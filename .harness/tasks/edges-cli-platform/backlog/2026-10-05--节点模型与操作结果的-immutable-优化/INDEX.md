---
name: node-immutability
description: 当前 Node 采用原地更新；后续评估 immutable 与实例生命周期，普通优先级，不阻塞递归节点重构。
metadata:
  edges-type: task
  edges-title: 节点模型与操作结果的 immutable 优化
  edges-tasks-status: backlog
  edges-task-project: edges-cli-platform
  edges-task-priority: medium
  edges-updated-at: '2026-10-05T11:27:03.622Z'
---

**背景：**
在递归节点重构第 5 项讨论中，move 已确定需要同步目录、路径派生 ID、父子关系及管理范围内的引用。随后讨论移动后是修改原 Node，还是返回新对象并使旧对象失效。用户提出将 immutable 单独记录为普通优化项，不作为当前重构的前置条件。

用户随后明确当前先采取原地更新策略：操作更新现有 Node 实例，move 同步修改其 path/id 与关系，返回同一个实例，不将原对象标为失效。Immutable 仅作为未来优化评估，不改变当前决定。

目前已确认的节点接口包含实例 parse、create、update 等行为；本任务不预先要求将它们全部改为不可变接口。

**目标：**
评估并优化节点模型及 Service 操作的不可变性，明确新旧实例、共享引用和写入快照的使用语义，减少意外原地修改造成的不一致。

**动作：**
- 以当前原地更新行为为基线，从 move 入手评估不可变对象的收益、成本及与现有接口的兼容方式。
- 明确旧对象是否可读、何时禁止继续写入，以及调用方如何取得更新后的节点。
- 再决定是否扩大到 update、parse 及子节点集合，避免未经评估直接改动整套接口。

完成标准待后续设计讨论补充。
关联：docs/discussions/2026-10-05-implementation-rulings.md 第 5 项。
