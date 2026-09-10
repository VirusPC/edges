# tasks

跨 Agent 接力的工作项看板。子目录名等于 `edges-tasks-status`：

`backlog` | `todo` | `in_progress` | `in_review` | `done` | `blocked` | `cancelled`

- 新人侧捕获默认落入 `backlog/`。
- 每个 Task 同目录有 sidecar `.{stem}.log.md`，只追加 Run 执行记录，不写入 Task 正文。
- 指派制，不是 Multica 式可抢单队列。
- Task 记录员只追加时直接推 `main`，不提 PR。
