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
2. 若目标已有 `users/user_*.md`，或 `USER.md` 的条目区不是空的「暂无条目」，先说明会覆盖，**得到确认后再加 `--force`**。空的 init 产物（只有空索引）可以直接回注。
3. 执行：

   ```bash
   python3 <skill-dir>/scripts/restore.py \
     --archive <归档路径> \
     --repo-dir <仓库目录> \
     [--force]
   ```

4. 脚本只解压 `.memory/USER.md` 与 `.memory/users/` 下的成员，拒绝 `..` 与绝对路径。
5. 若目标已有本套 `AGENTS.md`，只刷新 `user` 索引，不跑 init。
6. 汇报解压了哪些路径。**不要 `git add` 回注结果。**
