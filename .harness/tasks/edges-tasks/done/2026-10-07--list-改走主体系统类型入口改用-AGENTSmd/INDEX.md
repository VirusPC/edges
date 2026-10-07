---
metadata:
  edges-type: task
  edges-task-project: edges-tasks
  edges-updated-at: '2026-10-07T12:00:00.000Z'
  edges-title: list 改走主体系统，类型入口改用 AGENTS.md
  edges-tasks-status: done
  edges-task-priority: none
name: list_subject_system_agents_md
description: >-
  用户命令范围只由 `--scope` / `--super` / `--all` 决定；记忆与技能类型入口从 README 改为
  AGENTS.md。根上维护任务当时仍挂在项目 README，未在本 PR 收完（见 #170）。
---
**背景：**
森林与 harness-materials（#167）落地后，list 仍需明确「从哪个主体系统 traverse」以及类型索引用什么文件。同时要把 memory/skills 类型入口统一到 AGENTS.md，避免 README 与层入口两套真相。本 PR 自测说明：仓库根默认 list 仍走不到 `.harness/tasks` 里记在项目 README `project-entries` 上的维护任务——该缺口由后续 #170 收口。
- 非目标：不把 README project-entries 抄进 AGENTS；不在 list 里加第二套遍历
- 关联：PR https://github.com/VirusPC/edges/pull/168；后续 done 卡「让 tasks list 顺着 AGENTS.md 走到任务」（#170）

**目标：**
list 范围合同稳定（scope/super/all）；类型入口路径为 `.harness/<module>/<plural>/AGENTS.md`。

**完成标准：**
- [x] 范围只由 `--scope` / `--super` / `--all` 组合决定；缺文件的登记跳过
- [x] `--super tasks list` 仍列出仓库根 `tasks/` 领域任务
- [x] 类型入口改为 AGENTS.md（父级索引同步）
- [x] 变更经 PR #168 squash 合入 main（`774d8965`）
