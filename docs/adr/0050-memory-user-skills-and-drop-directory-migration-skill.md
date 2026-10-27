---
status: accepted
---

# 用户记忆归档技能改名，并删除目录迁移技能

2026-10-27 用户确认。用户记忆的备份与恢复技能改到 `edges-memory-user-*`。目录迁移不再有随包技能。旧技能名不再识别，不留别名。

**Status:** accepted（ADR 0050）

**Supersedes（局部）：** [ADR 0049](0049-edges-skills-markers-rename.md) 表中这三行的现行名字：`user-memory-backup` → `edges-user-memory-backup`、`user-memory-restore` → `edges-user-memory-restore`、`migrate-directory-nodes` → `edges-migrate-directory-nodes`。0049 的其余技能改名、标记硬切断、以及「旧 tag 留在历史提交上」仍然有效。

**See also:** [ADR 0003](0003-user-memory-in-repo-gitignored.md)（用户记忆在仓内且 gitignore；默认归档前缀从本决定起改为 `edges-memory-user-backup-`）

## Decision

1. **两份技能只改名。** 目录与 `SKILL.md` 的 `name` 同时改为：

   | 旧名 | 新名 |
   | --- | --- |
   | `edges-user-memory-backup` | `edges-memory-user-backup` |
   | `edges-user-memory-restore` | `edges-memory-user-restore` |

   不读 `edges-user-memory-*`，也不读更早的 `user-memory-*`。不留同名软链。版本保持 `0.1.0`：这次没有新的行为契约，只换名字，并让默认归档文件名跟上新名字。不从 `4.0.0` 或上一名的 `0.1.0` 递增。

2. **默认归档文件名跟着技能名。** `edges memory backup` 写出 `edges-memory-user-backup-<UTC时间戳>.tar.gz`。`edges memory restore` 按调用者给出的路径读取，不根据文件名判断技能；改名前已经打好的归档仍可按路径恢复。根 `.gitignore` 同时忽略新旧前缀，避免旧文件被提交。这不是技能别名。

3. **删除目录迁移技能。** `edges-migrate-directory-nodes` 从包内移除，不设替代技能，也不再识别 `migrate-directory-nodes`。单文件改目录入口仍是仓库维护命令 `pnpm migrate:directory-nodes --root <工作树>`，实现仍是 `scripts/migrations/edges-migrate-directory-nodes.mts`。该命令和文件名是维护工具，不是技能入口。

4. **旧 tag 不移动。** `skill/edges-user-memory-backup@0.1.0`、`skill/edges-user-memory-restore@0.1.0`、`skill/edges-migrate-directory-nodes@0.1.0`，以及更早的 `skill/user-memory-*@*`、`skill/migrate-directory-nodes@*`，留在当时的提交上。新名字的 `skill/edges-memory-user-backup@0.1.0` 与 `skill/edges-memory-user-restore@0.1.0` 在含这次改名的提交上另打，不覆盖旧 tag。被改到正文的 `edges-memory-init` 与 `edges-memory-remember` 升到 `0.1.1`，对应 tag 也另打，不移动 `0.1.0`。

## Considered Options

- **留 `edges-user-memory-*` 别名：** 否决。与 0049 的硬切断一致。两套名字会让下一次调用继续写旧名。
- **为纯改名把版本升到 `0.2.0`：** 否决。版本线当天已重启为 `0.1.0`，这次没有新的备份或恢复契约。归档文件名是同一条改名的一部分。
- **连 `pnpm migrate:directory-nodes` 一起改名或删除：** 否决。要删的是随包技能。维护脚本仍给尚未转换的工作树使用，日常创建不走它。

## Consequences

- 已安装的旧技能副本不会被这次改名自动替换。需要重新 `edges skills init`。
- 本 ADR 不执行 npm 发布，也不移动或删除已有 tag。
- 已发版 changelog、ADR 0049 的原表、以及已完成计划里出现的旧技能名，保留当时事实。现行说明不再指示调用旧名。
