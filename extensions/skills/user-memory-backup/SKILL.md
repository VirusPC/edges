---
name: user-memory-backup
description: 把本仓库 gitignore 的用户记忆（.memory/users/ 与 .memory/USER.md）打成归档。换机、删仓或想留一份逃生副本时用。默认写到仓库根 user-memory-backup-<时间戳>.tar.gz，不要 git add。恢复用 user-memory-restore。
version: 1.0.0
---

# User Memory Backup

把当前仓库工作树里的用户记忆打成归档。权威副本在仓内且 gitignore（ADR-0003），所以换机或 `rm -rf` 克隆会丢掉它。这是逃生口，不是晋升到可提交类型。

下文的 `<skill-dir>` 是本 SKILL.md 所在目录。

## 什么时候用

- 用户要备份、带走、或在删仓/换机前留一份用户记忆。
- 不要用它把内容提交进 git。归档本身也被根 `.gitignore` 的 `user-memory-backup-*.tar.gz` 挡住。

## 步骤

1. 确认目标是哪一个仓库目录（有 `.memory/` 的那一层，通常是 git 根）。
2. 问用户归档落到哪个目录。默认是**该仓库根**。
3. 执行：

   ```bash
   python3 <skill-dir>/scripts/backup.py \
     --repo-dir <仓库目录> \
     [--output-dir <归档目录>]
   ```

4. 脚本只打包已存在的 `.memory/USER.md` 和 `.memory/users/` 下的文件。两份都没有就失败。
5. 把返回 JSON 里的 `archive` 路径告诉用户。**不要 `git add` 归档，也不要 `git add` `.memory/USER.md` / `.memory/users/`。**

恢复用 `$user-memory-restore`。
