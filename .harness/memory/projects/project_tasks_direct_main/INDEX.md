---
name: project_tasks_direct_main
description: >-
  2026-09-10 旧 knowledge/tasks 只追加速记曾约定直推 main；当前任务写入所选 scope 的节点 harness
  tasks，并遵守独立 worktree。
metadata:
  edges-title: 2026-09-10 Task 速记直推 main（历史约定）
  edges-type: project
  edges-origin-session-id: ed32d8b9-d356-4eb9-8822-6ad2ddc36d1c
  edges-agent-client: cursor
  edges-username: viruspc
  edges-email: cheng.peng.helloworld@gmail.com
  edges-updated-at: '2026-10-07T17:40:53+08:00'
---

**现行适用边界（2026-10-05）：**Task 速记由 Skill 选择 `--scope` 后写入该根节点指向的 harness `tasks/`：不传 `--super` 为 `<scope>/.harness/tasks`，`--super` 为 `<scope>/tasks`。遵守独立 worktree 的仓规。下述“直接推 main、不提 PR”是 2026-09-10 对旧 `knowledge/tasks/` 只追加速记的约定记录，不作为当前看板路径或绕过工作树纪律的操作指令。是否直接合入由当次发布流程决定。

**Why:**
这类内容是跨 Agent 接力的工作项，只追加、不改历史主干逻辑；走 PR 会拖慢记事节奏。用户已明确要求 Task 记录员追加跳过默认 PR 流程（承接原 todos 直推 main 约定）。

**How to apply:**
- 当前追加 Task：Skill 选定 scope 后，由 `edges tasks` 写入该节点 harness `tasks/` 下所属 Task Project 的 `backlog/`；在独立 worktree 中提交，按当前发布流程交付。
- 历史上的“直接推 main、不提 PR”仅解释当时速记的时效性取舍；不适用于 `knowledge/notes/` 等知识归档，也不覆盖本仓现行 Git 约束。
