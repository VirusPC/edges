# knowledge/todos 迁为 knowledge/tasks，并按 edges-tasks-status 分夹

idea 经记录员落盘，再经 grill-with-docs 与 deep-research 细聊，交给 Cloud Agent 开发并回写状态。工作项不再叫 todo 勾选清单。

**Decision:** 用 `knowledge/tasks/<status>/` 取代 `knowledge/todos/`。Issue 层唯一状态字段是 `metadata.edges-tasks-status`，取值沿用 task-board-lifecycle Conclusion 的七态：`backlog` | `todo` | `in_progress` | `in_review` | `done` | `blocked` | `cancelled`。frontmatter 按 project-memory-init 形状，含 `edges-type: task` 与 `edges-task-*` 键。Run 历史只追加到同目录 sidecar `.{stem}.log.md`，不写入 Task 正文或 frontmatter；正文为结论 → **Why:** → **How to apply:**。删除旧 `knowledge/todos/` 目录，不留 stub。指派制，不是可抢单队列。

**Why:** 命名与生命周期对齐；状态分夹让看板可浏览；project-memory frontmatter 保住可查询标量；sidecar 让 YAML 稳定。这同时修正 Conclusion 里「todos 当系统外池、backlog 基本闲置、Run 写进正文表」的过渡假设。
