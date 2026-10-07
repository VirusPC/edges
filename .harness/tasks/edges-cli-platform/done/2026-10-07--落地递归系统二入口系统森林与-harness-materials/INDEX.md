---
metadata:
  edges-type: task
  edges-task-project: edges-cli-platform
  edges-updated-at: '2026-10-07T12:00:00.000Z'
  edges-title: 落地递归系统二入口、系统森林与 harness-materials
  edges-tasks-status: done
  edges-task-priority: none
name: system_forest_harness_materials
description: >-
  AGENTS/README 并列登记，traverse 只跑单系统 children，森林外拼；引入 harness-materials 与
  `--super` / `forest list`，删掉旧 content-face 兼容。
---
**背景：**
递归维护空间（#161）之后，还需要把「系统二入口怎么挂材料、多系统如何组成森林、`--super` 挂什么」收成稳定合同，否则 list/查询范围会继续靠特判。
- 关联：PR https://github.com/VirusPC/edges/pull/167；计划 `docs/superpowers/plans/2026-10-07-system-forest-super-harness-materials.md`；后续 #168/#170 继续修 list 可达性

**目标：**
单系统 traverse 与森林拼装边界清晰；harness 材料由配置挂载；CLI 可列出森林形态。

**动作：**
- `harness-materials.json`：`materials[{id,path,optional}]`；harness 根解析规则落地
- `--super` / SuperAgentsNode 按配置挂材料 README；`edges forest list [--form independent|innermost] [--no-super]`
- 删除 `includeContentFace` / companion 兼容；文档与反馈记忆同步

**完成标准：**
- [x] traverse 只跑单系统 children；森林在外拼装
- [x] `pnpm --filter edges-cli test` 通过（合入时 971 pass）
- [x] 变更经 PR #167 squash 合入 main（`645f5eae`）
