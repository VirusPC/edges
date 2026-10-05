---
metadata:
  edges-type: task
  edges-task-project: edges-cli-platform
  edges-updated-at: '2026-10-05T22:52:25.691Z'
  edges-title: 弄清 extensions/cli 里 node-merge 的作用
  edges-tasks-status: done
  edges-task-priority: none
name: extensions_cli_node_merge
description: 弄清 node-merge 在 Edges CLI 中的职责与调用链；调查已完成，结论见完成记录与 Run log。
---
## 2026-10-05 完成记录

结论：`node-merge` 是 Edges CLI 里对「同一节点多个内存别名」做三方合并的内部模块（非对外子命令）。脏别名未保存时，另一次写盘会经 NodeCache → mergeNode 调和 base/dirty/committed；冲突则抛 Cached node edit conflict。定义在 `extensions/cli/src/services/node-merge.ts`，正文走 `node-text-merge.ts`，唯一调用方 `node-cache.ts`，由 `node-service.ts` 编排。

调查方：云端 worker `bc-0cf5c04f-f51f-56c8-9c3a-c038994c3513`（已完成）。下文保留建卡时的背景与目标。

**背景：**

用户在 Project「Edges CLI node-merge」中要求弄清 `extensions/cli` 里 `node-merge` 的作用；并纠正进度应记在 Edges tasks（本仓维护板 `.harness/tasks/`，旧称 knowledge/tasks），不要主要写在 Project Notes。开卡时已有云端 worker 在调查；调查完成后回写结论并将本卡标为 done。

- 相关现状：`node-merge` 位于 CLI services，不是公开子命令
- 预期收益：后人读卡即可知道模块职责与调用链，避免再从零搜
- 非目标：不改实现、不扩成对外命令、不做重构
- 关联：调查 agent `bc-0cf5c04f-f51f-56c8-9c3a-c038994c3513`

**目标：**

弄清 `extensions/cli` 中 `node-merge` 的职责、调用链与冲突行为，并把可复核结论落在本 Task。

**完成标准：**
- [x] 结论写明是否对外子命令、三方合并语义、冲突错误名
- [x] 结论写明定义文件与唯一调用方
- [x] Issue 状态为 done，Run log 记有本次调查
