---
metadata:
  edges-type: task
  edges-task-project: project-memory
  edges-updated-at: '2026-10-02T12:00:00.000Z'
  edges-title: 文档明确个人 RSI 与通用递归作用域
  edges-tasks-status: done
  edges-task-priority: none
name: personal_rsi_recursive_scope
description: >-
  README / CONTEXT / 项目记忆把「个人递归自我改进」与系统一／系统二、harness、递归作用域说清楚；目录迁移与 CLI scope
  实现留给后续卡。
---
**背景：**
2026-10-01 前后把 Edges 的实践目标写成「个人 RSI」：持续提升自己，也提升自我改进的能力；同时需要把知识闭环、递归作用域与术语（系统一／系统二、harness、meta-harness）写进给人读的入口，避免实现卡开干时概念漂移。本 PR 只改文档、记忆和登记后续任务，不重划目录、不实现 CLI scope。
- 相关现状：README 四视角与七条核心思想保留；CONTEXT 明确根=主体作用域、维护空间承载系统二
- 预期收益：后续递归目录 / scope 解析卡有统一术语锚点
- 非目标：目录迁移、CLI `--scope` 实现（另卡；后者后经 #161 落地）
- 关联：PR https://github.com/VirusPC/edges/pull/160；兄弟卡「整仓与 memory 同构递归融合」「为 Edges CLI 建立统一的工作 scope 解析」

**目标：**
文档与项目记忆一致表达 RSI 目标与通用递归作用域；读者能分清设计目标与现有能力，以及 Git 跟踪/忽略与共享边界。

**动作：**
- 更新 README / CONTEXT 术语与作用域叙述
- 项目记忆记下最终决策与采用理由
- 在 edges-cli-platform 登记「统一工作 scope 解析」backlog（当时）

**完成标准：**
- [x] README / CONTEXT / 相关记忆已对齐 RSI 与递归作用域表述
- [x] 独立复核概念一致性与本地链接；`git diff --check` 通过
- [x] 变更经 PR #160 squash 合入 main（`0fddb5ad`）
