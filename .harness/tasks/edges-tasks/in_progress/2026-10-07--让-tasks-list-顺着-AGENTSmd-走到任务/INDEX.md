---
metadata:
  edges-type: task
  edges-task-project: edges-tasks
  edges-updated-at: '2026-10-07T11:14:00.709Z'
  edges-title: 让 tasks list 顺着 AGENTS.md 走到任务
  edges-tasks-status: in_progress
  edges-task-priority: high
name: tasks_list_agents_md
description: 仓库根 tasks list 应列出 AGENTS.md 指向的 .harness/tasks 任务；--all 的森林里也要有这些任务节点。
---
**背景：**
2026-10-07 在核对 `edges tasks list` 的 `--scope`、`--super`、`--all` 时，仓库根默认列出 0 条，`--super` 列出 `tasks/` 下 5 条，`--all` 也是 0。顺着根 `AGENTS.md` 看，它指向 `.harness/tasks/AGENTS.md`，这份文件的 children 是记忆、技能和 `tech-reading/AGENTS.md`。103 条维护任务记在各项目 `README.md` 的 `project-entries` 上，遍历 `AGENTS.md` 的 children 到不了。`--super` 不走这条链，直接挂 `<仓库根>/tasks/README.md`，所以那 5 条是对的。`--all` 有走森林，那些 `AGENTS.md` 树里同样没有任务节点，滤完还是 0。当时把项目 README 链接抄进看板 `AGENTS.md` 被否掉，不要在 list 里再读 README。
- 范围只由 `--scope`、`--super`、`--all` 决定。一般主体是 `--scope`，任务写在该系统的 `.harness/tasks`；虚拟系统一用 `--scope <仓库根> --super`，写在 `<仓库根>/tasks`。
- 非目标：不在 list 里补第二套遍历，也不把 README 上的链接再抄一份到 `AGENTS.md`。
- 关联：工作树 `fix/super-follows-scope`；报告 `docs/superpowers/reports/2026-10-07-cli-results.md`。

**目标：**
仓库根 `tasks list` 列出 `AGENTS.md` 指向的 `.harness/tasks` 里的任务；`--all` 的森林里这些任务节点也在。

**完成标准：**
- [ ] `edges --scope <仓库根> tasks list` 列出 `.harness/tasks` 里、由 `AGENTS.md` children 走到的任务
- [ ] `edges --scope <仓库根> --super tasks list` 仍只列出 `<仓库根>/tasks` 上的领域任务
- [ ] `edges --scope <仓库根> --all tasks list` 走森林，结果里包含各系统 `AGENTS.md` 下的任务节点，而不是因为树上没有任务而得到 0
