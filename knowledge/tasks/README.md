# tasks

跨 Agent 接力的工作项看板。

## 参考

设计参考 **[Multica](https://github.com/multica-ai/multica)** 的双层模型（Issue + Task/Run），再按本仓库场景裁剪：指派制、去掉多机 daemon 抢单调度态。细节依据见 `knowledge/projects/task-board-lifecycle/Conclusion.md` 与 `docs/adr/0002-knowledge-tasks-status-folders.md`。

## 两层对应（Multica → edges）

| Multica | 本仓库 | 落点 |
| --- | --- | --- |
| **Issue**（工作项本身，一个状态） | **Task 文件**（`*.md`） | `knowledge/tasks/<edges-tasks-status>/` |
| Issue 状态 | `metadata.edges-tasks-status` | 与所在子目录名一致 |
| **Run / 执行任务**（一次执行尝试，可 1:N） | **Task Run Log** | 同目录 sidecar `.{stem}.log.md` |
| Run 状态 | log 表里的 `status` 列 | `pending` \| `running` \| `completed` \| `failed` \| `cancelled` |

要点：

- **Issue 层看「这件事处在哪一阶段」**；**Run 层看「某次执行试了几次、结果如何」**。Task 状态不由 Run 状态直接推导。
- 砍掉 Multica Run 侧的 `deferred` / `queued` / `dispatched` / `waiting_local_directory` 等调度态（本场景执行方是仓库内 agent 会话，不是常驻 daemon 抢单）。
- **指派制，不是抢单队列**：没有独立 Claimed；认领与开工合一为进入 `in_progress`。

## Issue 层状态夹

子目录名等于 `edges-tasks-status`：

`backlog` | `todo` | `in_progress` | `in_review` | `done` | `blocked` | `cancelled`

- 新人侧捕获默认落入 `backlog/`。
- **派发默认**：执行方先 `grill-with-docs`（CONTEXT / ADR），过关后再实现；用户当次明确跳过除外。
- 改状态时：更新 frontmatter 的 `edges-tasks-status`，并把文件（及同 stem 的 `.*.log.md`）移到对应子目录。

## 文件约定

- Task 正文：结论 → **Why:** → **How to apply:**（对齐 project-memory-init）；**不写**执行流水。
- Run 只追加到 `.{stem}.log.md`（点文件 sidecar），不改历史行、不塞进 frontmatter。
- Task 记录员只追加 / 改状态时直接推 `main`，不提 PR。
