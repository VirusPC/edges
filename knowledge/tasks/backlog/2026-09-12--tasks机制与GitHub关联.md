---
name: tasks_board_github_association
description: edges knowledge/tasks 机制与 GitHub Issues/PR/Projects 如何关联
metadata:
  edges-type: task
  edges-title: tasks 机制与 GitHub 关联
  edges-tasks-status: backlog
  edges-origin-session-id: d807a059-9774-4fd0-8fa7-d5fb69f9d031
  edges-agent-client: cursor
  edges-username: 任务记录员
  edges-email: grok-bot@users.noreply.github.com
  edges-updated-at: "2026-09-12T10:38:00+08:00"
---

edges 的 `knowledge/tasks` 机制能否、以及应如何与 GitHub 的机制（Issues / PRs / Projects）关联起来。

**Why:**
看板已经是 Multica 式双层（Task 文件 = Issue，sidecar log = Run），实现侧又经常开 GitHub PR。两边若只靠聊天和手写 `edges-task-pr`，状态、指派、review 容易各走各的。关联不是为了再做一个同步器，而是让「仓内真源」和「GitHub 协作面」能对上号。

GitHub Issue 相当于仓级「根目录」：一张平铺名单（label / milestone / 新的 parent-issue 只是软层级），对嵌套目录和 monorepo 不友好。仓内 Task 可以按状态夹、需求夹、包路径长在树上；Issue 做不到同构，所以不宜把 Issue 当成 Issue 层真源。

**How to apply:**
- 先画对照，不要默认双向同步。候选：Task 文件 ↔ GitHub Issue；一次 Run / 实现 ↔ PR；`edges-tasks-status` ↔ Projects 列（或只单向投影）。
- 已有弱关联：`edges-task-pr` / `edges-task-pr-impl`、看板直接推 main、实现走 PR。细聊时定哪些升成约定字段（如 `edges-task-issue`），哪些保持手记。
- 权衡：GitHub 当展示/评审面 vs 当第二真源。第二真源会和「tasks 只追加/改状态推 main」打架。
- 与「tasks 配套 skill」「多人协作与作者区分」「记录仓与执行仓分离」一起看，避免三套状态机。
- 细聊用 grill-with-docs 再定 ADR。
