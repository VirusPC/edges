---
name: project_list_all_forest
description: >-
  改 edges 的 list 或写任务时：范围只由 --scope、--super、--all 组合决定；tasks 写入主体系统的
  .harness/tasks。
metadata:
  edges-title: scope、super、all 的组合形成一切
  edges-type: project
  edges-origin-session-id: ed32d8b9-d356-4eb9-8822-6ad2ddc36d1c
  edges-agent-client: cursor
  edges-username: viruspc
  edges-email: cheng.peng.helloworld@gmail.com
  edges-updated-at: '2026-10-07T17:46:15+08:00'
---

`--scope`、`--super`、`--all` 的组合形成一切。没有第二套范围开关。

走节点树的 list（`tasks list`、`tasks project list`、`memory list`、`skill list`、`note list`）不传 `--all` 时是当前 scope 的一棵树，传 `--all` 时是从该 scope 出发的森林。三个开关同级，挂在根命令上。最全的一次查询是 `--scope <仓库根> --super --all`。仓库根与 `<仓库根>/.harness` 的实测报告在实现完成之后再交，实现前不跑。

Tasks 不理解用途，也不理解 index-group。它只看主体系统，然后往这个系统的 `.harness/tasks` 里写。一般 `--scope` 就是主体：看板是 `<scope>/.harness/tasks`。主体是仓库之外的虚拟系统一时，用 `--scope <仓库根> --super`；该系统的 harness 就是传入的 scope 目录，看板是 `<仓库根>/tasks`。

**Why:** 用户 2026-10-07 收口。用途和本层/下层是主体系统之外的第二套分类。主体是谁，由 `--scope` 与是否 `--super` 决定；看一棵树还是一片森林，由是否 `--all` 决定。

**How to apply:** 无 `--all` 用 `NodeService.query`；有 `--all` 用 `buildSystemForest(scope)`，`includeSuper` 跟随 `--super`。tasks 命令、帮助和 skill 只出现这三个开关。`conversation-to-tasks` 与 `project-tasks-classify` 一般只传 `--scope`；主体是仓库根上的虚拟系统一时再加 `--super`。验收矩阵在实现完成之后，不要提前跑仓库根 / `.harness`。
