---
name: user-memory-restore
description: 把 user-memory-backup 归档回注到某仓库的 .memory/users/ 与 .memory/USER.md。换机或删仓后恢复本机用户记忆时用。目标已有条目时必须确认/--force，不要 git add。
version: 1.0.0
---

# User Memory Restore

把 `$user-memory-backup` 打出的归档回注进一个仓库工作树。权威副本仍是仓内 gitignore 文件，不是 git 历史。

下文的 `<skill-dir>` 是本 SKILL.md 所在目录。

## 什么时候用

- 用户提供一份 `user-memory-backup-*.tar.gz`（或兼容的 `.tar` / `.tar.bz2`），要写回某个仓库的 `.memory/USER.md` 与 `.memory/users/`。
- 不要用它把用户记忆提交进 git，也不要脱敏晋升到 `project` / `feedback`。

## 步骤

1. 向用户要归档路径和目标仓库目录。
2. 若目标已有 `users/user_*.md`，或 `USER.md` 的条目区不是空的「暂无条目」，先说明会**整份替换**（不是合并），**得到确认后再加 `--force`**。空的 init 产物（只有空索引）可以直接回注。
3. 执行：

   ```bash
   python3 <skill-dir>/scripts/restore.py \
     --archive <归档路径> \
     --repo-dir <仓库目录> \
     [--force]
   ```

4. `--force` 是替换：解压前先丢掉目标 `.memory/users` 与 `.memory/USER.md`（符号链接只删链接本身，不跟随；目录用整树删除），再写入归档里的文件，然后重算索引。归档里没有的 slug **不会**留在目标目录（旧密钥/轮换掉的条目必须消失）。
5. 脚本只写入 `.memory/USER.md` 与 `.memory/users/` 下的**普通文件**。拒绝符号链接、设备文件、`..`、绝对路径，以及解析后落到 `.memory/` 之外的成员。不要依赖 Python 3.12 的 `filter="data"`。
6. 若目标已有本套 `AGENTS.md`，只刷新 `user` 索引，不跑 init。
7. 汇报解压了哪些路径。**不要 `git add` 回注结果。**
