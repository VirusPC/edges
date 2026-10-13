---
name: feedback_scope_super_all
description: >-
  改 edges 的 list、写任务、帮助或 skill 时：范围只由 --scope、--super、--all
  组合决定，不要再加用途、index-group 或另一套全仓开关。
metadata:
  edges-title: scope、super、all 的组合形成一切
  edges-type: feedback
  edges-origin-session-id: ed32d8b9-d356-4eb9-8822-6ad2ddc36d1c
  edges-agent-client: cursor
  edges-username: viruspc
  edges-email: cheng.peng.helloworld@gmail.com
  edges-updated-at: '2026-10-07T17:46:13+08:00'
---

`--scope`、`--super`、`--all` 的组合形成一切。

**Why:** 用户 2026-10-07 收口。原先 tasks 自己理解用途和 index-group，是在主体系统之外又加一套分类，所以命令越来越复杂。

**How to apply:** 改 list、写任务、帮助或 skill 时，范围只使用这三个根开关。`--scope` 选定主体；`--super` 把主体换成该 scope 上的虚拟系统一；`--all` 从当前 scope 走森林。一般 `--scope` 就够。主体是仓库之外的虚拟系统一时，用 `--scope <仓库根> --super`，任务写入该系统的 `.harness/tasks`（即 `<仓库根>/tasks`）。真系统的看板是 `<scope>/.harness/tasks`。最全的查询是 `--scope <仓库根> --super --all`。不要再加用途、分组或另一套全仓开关。
