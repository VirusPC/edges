---
name: tasks_skill_crud_status
description: tasks 应提供配套 skill，统一增删改查与状态流转操作接口
metadata:
  edges-type: task
  edges-title: tasks 配套 skill：CRUD 与状态流转
  edges-tasks-status: in_progress
  edges-task-assignee: Coding Agent 专家
  edges-task-assignee-id: ac913463-5bf6-4c16-adc0-900c61a8692d
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: 任务记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-12T12:08:00+08:00"
---

tasks 应提供配套 skill：做增删改查与状态流转管理，并对外提供统一操作接口。

**Why:**
现在落盘/改状态多靠手搓 git 与约定；没有统一 skill 时，各 Agent 容易写偏 frontmatter、漏搬 sidecar、或状态夹与 `edges-tasks-status` 不一致。配套 skill 把看板操作收成一种接口，才能和 idea→细聊→开发→改状态 的流水线对齐。

**How to apply:**
- 设计 skill 能力面：create / read / update / delete（或 archive）+ 状态流转（改 `edges-tasks-status` 并移动文件与 `.{stem}.log.md`）。
- 接口约定与 `knowledge/tasks/README.md`、ADR 0002、Multica Issue/Run 双层对齐。
- 细聊时用 grill-with-docs 定命令/参数形态；再交 Cloud Agent 实现。
