---
name: feedback_artifact_from_task_is_kind
description: 改 artifact meta / edges artifacts publish 的 from 时打开：task 是 from.type 的一种来源，不要再写顶层 task 或 from.kind；v1 可选 from 只允许 {type:task,id,project}；CLI 是 --from-type / --from-id / --task-project。
metadata:
  edges-title: task 是 from.type，不是顶层字段
  edges-type: feedback
  edges-origin-session-id: bc-a74e83b7-668b-5368-ad51-fafafec047b5
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-20T16:44:26+00:00"
---

`task` 是 `from.type` 的一种来源，不是 `meta.json` 的顶层兄弟字段。判别字段叫 `type`，不叫 `kind`。v1 里 `from` 可选，且只允许 `{ type: "task", id, project }`（`id` 是 task stem，`project` 放最后）。

**Why:**
2026-09-20 peng cheng 纠正：先加过顶层 `task: { project, stem }`，但来源只有一个槽。同日再改名：`from.kind` → `from.type`。同日最终砍掉 skill|cli|agent 与 `name`/`stem`，字段改叫 `id`。

**How to apply:**
- `meta.json` 顶层只有 `id` / `entry` / `expiresAt`，外加可选 `from`。不要再加顶层 `task`。
- 有任务关联时写 `from: { type: "task", id, project }`。没有关联就整段省略。
- 不要写 `from.name`、`from.stem`，也不要默认 `{ type: "cli", name: "edges-cli" }`。
- CLI：`--from-type task --from-id <stem> --task-project <slug>`（三者同出或全省略）。不要 `--from-kind` / `--from-name` / `--task-stem`。
