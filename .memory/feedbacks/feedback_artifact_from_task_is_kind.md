---
name: feedback_artifact_from_task_is_kind
description: 改 artifact meta / edges artifacts publish 的 from 时打开：task 是 from.kind 的一种来源，不要再写顶层 task {project,stem}；kind=task 用 project+stem，其他 kind 用 name。
metadata:
  edges-title: task 是 from.kind，不是顶层字段
  edges-type: feedback
  edges-origin-session-id: bc-a74e83b7-668b-5368-ad51-fafafec047b5
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-20T16:38:24+00:00"
---

`task` 是 `from.kind` 的一种来源，不是 `meta.json` 的顶层兄弟字段。

**Why:**
2026-09-20 peng cheng 纠正：先加过顶层 `task: { project, stem }`，但来源只有一个槽。`from` 用 `kind` 判别——`task` 带 project+stem，其他 kind 带 name。

**How to apply:**
- 新 publish 只写 `id` / `entry` / `expiresAt` / `from`。不要再加顶层 `task`。
- `from.kind === "task"` 时校验 `project` + `stem`，不要 `name`。
- 其他 kind（`skill` | `cli` | `agent` | …）校验 `name`，不要 project/stem。
- CLI：`--from-kind task --task-project … --task-stem …`；默认仍是 `{ kind: "cli", name: "edges-cli" }`。不要把 task flags 当成独立 meta.task。
