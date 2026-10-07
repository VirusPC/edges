---
name: project_list_all_forest
description: >-
  改 edges tasks 的登记或 list 时：任务要写在 AGENTS.md 的 children 上；只写 README
  project-entries 是 CLI 的错。
metadata:
  edges-title: scope、super、all 的组合形成一切
  edges-type: project
  edges-origin-session-id: ed32d8b9-d356-4eb9-8822-6ad2ddc36d1c
  edges-agent-client: cursor
  edges-username: viruspc
  edges-email: cheng.peng.helloworld@gmail.com
  edges-updated-at: '2026-10-07T18:37:31+08:00'
---

`--scope`、`--super`、`--all` 的组合形成一切。没有第二套范围开关。

走节点树的 list 不传 `--all` 时是当前 scope 的一棵树，顺着 `AGENTS.md` 的 children 走到任务。传 `--all` 时，第一步是扫当前 scope 下的整个文件系统，范围内的节点入口都算进去，再按类型留下。最全的一次查询是 `--scope <仓库根> --super --all`。

CLI 把项目和任务写进 `README.md` 的 `project-entries`、父级 `AGENTS.md` 只挂看板 `AGENTS.md`，这是错的。任务要登记在 `AGENTS.md` 指得到的 children 上，这样仓库根的 `tasks list` 才能列出 `.harness/tasks` 里的任务。

Tasks 不理解用途，也不理解 index-group。它只看主体系统，然后往这个系统的 `.harness/tasks` 里写。一般 `--scope` 就是主体：看板是 `<scope>/.harness/tasks`。主体是仓库之外的虚拟系统一时，用 `--scope <仓库根> --super`；该系统的 harness 就是传入的 scope 目录，看板是 `<仓库根>/tasks`。

**Why:** 用户 2026-10-07 确认。根 `AGENTS.md` 指向 `.harness/tasks/AGENTS.md` 与 CLI 的写入一致，但那条链到不了任务叶子。错在 CLI 的登记位置，不是根文件手滑。

**How to apply:** 改 tasks 的创建、更新和 list 时，把项目与任务登记到 `AGENTS.md` 的 children，不要只写 README 的 `project-entries`。无 `--all` 用 `NodeService.query` 走这棵树。有 `--all` 先扫该 scope 的文件系统。`--super` 仍是该 scope 上的虚拟系统一。
