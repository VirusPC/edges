---
name: feedback_restore_force_replaces
description: 改 user-memory-restore 时：--force 先清空 users/ 与 USER.md 再解压；成员过滤不依赖 filter=data，拒绝 symlink 等非普通文件。
metadata:
  edges-title: Restore --force 整份替换，不合并
  edges-type: feedback
  edges-origin-session-id: bc-663b0001-3491-4486-adc3-bb07786f26e8
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-11T12:11:10+00:00"
---

`$user-memory-restore` 的 `--force` 是整份替换，不是合并；解压前必须清空目标 `.memory/users/` 与已有 `.memory/USER.md`。解压只用全版本可用的普通文件过滤器，禁止只依赖 Python 3.12 的 `filter="data"`。

**Why:**

PR #39 审查：extract + `refresh_index` 会留下归档里没有的目标 `users/` 文件，轮换掉的密钥会被重新编进索引。`filter="data"` 只在 3.12+ 存在，3.10/3.11 上符号链接等特殊成员可能逃出 `.memory/`。

**How to apply:**

- 改 `restore.py` 时：`--force` 先清空 `users/` 与 `USER.md`，再解压，再 `refresh_index`。不要做成按文件覆盖合并。
- 成员过滤必须在所有支持的 Python 上拒绝 symlink / device 等非普通文件；解析后的路径必须落在目标 `.memory/` 内；失败即拒。
- 回归：分叉 slug 的 `--force` 测孤儿消失；恶意 symlink 成员测拒绝。
- 替换语义写在 `user-memory-restore/SKILL.md`，不要只写在脚本注释里。
