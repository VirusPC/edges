# Tasks

此目录是领域任务看板；Edges 自身的维护任务在 [`.harness/tasks/`](../.harness/tasks/README.md)。两张看板都先按 Task Project 分组，再按 `edges-tasks-status`（backlog、todo、in_progress、in_review、done、blocked、cancelled）分夹。新捕获的任务默认落入 `backlog/`；执行记录写在同 stem 的 sidecar `.{stem}.log.md`，不写进 Task 正文。Task 不是 Note，也不是可抢单的队列条目。

看板变更优先走 `edges tasks` CLI：

- 在仓库根运行 `edges tasks list`，列出维护看板；加 `--super` 列出本目录的领域看板；加 `--all` 沿系统森林把各作用域一起列出。最全的一次查询是 `edges --scope <仓库根> --super --all tasks list`。
- 持久的 `/tasks/` 站点汇总领域任务与维护任务，并保留来源作用域：`pnpm --filter edges-cli exec tsx scripts/generate-tasks-site.ts --scope <仓库根> --purpose all`。

<!-- project-entries-local:start -->
## 本层内容

- [Agent Clients UX](<agent-clients-ux/README.md>) — 客户端/插件/外设与本地 UX 实验。
- [Project Memory](<project-memory/README.md>) — Project Memory 类型/索引/reshape/与 docs 边界等。
- [Site and Content](<site-and-content/README.md>) — 站点/posts/badge/内容整理检索。
<!-- project-entries-local:end -->
