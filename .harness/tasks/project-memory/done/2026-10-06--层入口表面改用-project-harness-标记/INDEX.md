---
metadata:
  edges-type: task
  edges-task-project: project-memory
  edges-updated-at: '2026-10-06T12:00:00.000Z'
  edges-title: 层入口表面改用 project-harness 标记
  edges-tasks-status: done
  edges-task-priority: none
name: project_harness_layer_markers
description: >-
  AGENTS.md 层入口 HTML 注释与标题从 project-memory 表面改成 project-harness；读写兼容旧标记，命令名与
  skill 目录名不动。
---
**背景：**
层入口三章对应的是 Git 项目上的系统二写法（Project Harness），表面仍叫 project-memory 易与「记忆模块 / edges memory 命令」混淆。需要改注释与标题表面，并更新 skill/CLI 读写逻辑；不改 `$project-memory-ask` / `remember` 与 `edges memory` 命令名。
- 非目标：不改 skill 目录名；不动 `project-memory-type` / entries 本轮合同
- 关联：PR https://github.com/VirusPC/edges/pull/166；兄弟卡 `project harness init skill`（init 能力，非本标记改名）

**目标：**
新写入只使用 project-harness 层标记与中文三章标题；读路径仍兼容旧 project-memory-* 标记。

**动作：**
- 外层/三章标记改为 project-harness / constraints / local / descendants；标题改为本层硬约束 / 本层组成 / 下层节点
- serialize、init 模板、memory 刷新只写新标记；存量迁移脚本可预览后 `--apply`
- CONTEXT / 协议 / LAYOUT / 模板用语对齐

**完成标准：**
- [x] 读兼容旧标记；无原稿只写新标记
- [x] `pnpm --filter edges-cli test` 通过（合入时 905 passed）
- [x] 变更经 PR #166 squash 合入 main（`72b05275`）
