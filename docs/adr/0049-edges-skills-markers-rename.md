---
status: accepted
---

# 随包技能与标记改为 `edges-*`

2026-10-27 用户确认。CLI 与随包技能只认 `edges-*`。旧的 `project-*` 技能名和标记不再读取，也不留别名。

**Status:** accepted（ADR 0049）

**Supersedes（局部）：** [ADR 0047](0047-rename-harness-directory-to-edges.md) Decision 2 里「`project-memory-*` 与 `project-entries-*` 保持原名」。该 ADR 的目录硬切断、删除 `edges memory migrate`、布局冻结仍然有效。本决定只把当时留下的技能名和类型/清单标记收进同一条 `edges-*` 链路。

## Decision

1. **技能硬切断。** `packages/skills/` 里下列目录连同 `SKILL.md` 的 `name` 改为新名。不读旧名，不留同名软链。每个改名技能的版本重启为 `0.1.0`，不从旧号递增。旧 annotated tag `skill/<旧名>@*` 留在历史提交上。

   | 旧名 | 新名 | 重启前版本 |
   | --- | --- | --- |
   | `project-memory-init` | `edges-memory-init` | 5.0.0 |
   | `project-memory-ask` | `edges-memory-ask` | 2.1.0 |
   | `project-memory-remember` | `edges-memory-remember` | 4.0.0 |
   | `project-memory-add-type` | `edges-memory-add-type` | 4.0.0 |
   | `project-tasks-classify` | `edges-tasks-classify` | 1.4.0 |
   | `user-memory-backup` | `edges-user-memory-backup` | 4.0.0 |
   | `user-memory-restore` | `edges-user-memory-restore` | 4.0.0 |
   | `conversation-to-notes` | `edges-conversation-to-notes` | 2.7.2 |
   | `conversation-to-tasks` | `edges-conversation-to-tasks` | 1.4.0 |
   | `migrate-directory-nodes` | `edges-migrate-directory-nodes` | 1.2.0 |
   | `langfuse-agent-tracing` | `edges-langfuse-agent-tracing` | 0.1.0 |
   | `langfuse-codex-cloud-tracing` | `edges-langfuse-codex-cloud-tracing` | 0.1.0 |
   | `langfuse-cursor-cloud-tracing` | `edges-langfuse-cursor-cloud-tracing` | 0.1.0 |
   | `langfuse-grokbot-tracing` | `edges-langfuse-grokbot-tracing` | 0.1.0 |
   | `langfuse-local-agent-tracing` | `edges-langfuse-local-agent-tracing` | 0.1.0 |

   已经是 `edges-*` 的技能保持原名和原版本：`edges-compose`、`edges-note`、`edges-onboarding`、`edges-routines`。

2. **删除两份技能，不设替代。** `project-memory-doctor` 与 `project-memory-reshape` 从包内移除。不要再安装或调用这两个名字。索引诊断仍是 CLI `edges memory doctor`。整理已有入口的区块外正文没有单独技能，按现行布局手改。

3. **标记硬切断。** 类型身份注释是 `edges-memory-type`。组织清单是 `edges-entries-local` 与 `edges-entries-descendants`。运行时不读 `project-memory-type`、`project-entries-*`、`project-memory-entries`。`project-memory-entries` 删除，不改名为 `edges-memory-entries`。层注释 `project-memory`、`project-memory-important`、`project-memory-local`、`project-memory-children` 不再算受管区块，解析器不双读。标题别名（例如「本层记忆」写成「本层系统维护信息」）仍在写入表面时替换，这不是标记双读。

4. **旧文件先改写再解析。** 一次性脚本 `scripts/migrations/rewrite-project-harness-markers.mts` 仍把上述旧层注释改写成 `edges` / `edges-*`。那是改写工具，不是运行时兼容。残留旧标记的文件在改写前视为未登记。

## Considered Options

- **技能与标记留旧名：** 否决。ADR 0047 已经把层标记收成 `edges-*`，技能和类型标记继续带 `project-` 会留下第二套前缀。
- **双读旧标记一个版本：** 否决。与目录和层标记的硬切断一致。两套名字会让下一次调用继续写旧名。
- **把 doctor / reshape 改名为 `edges-memory-doctor` / `edges-memory-reshape`：** 否决。诊断留在 CLI。reshape 的职责并进现行入口形状，不再单发技能。
- **沿用旧 semver 只改目录名：** 否决。新名字是新的版本线。旧 tag 仍指向旧目录历史。

## Consequences

- 调用方改用上表的新技能名。旧名没有别名。已安装的旧副本不会被本次改名自动替换，需要重新 `edges skills init`。
- 建议的下一次 npm 发布是 `@viruspc/edges@0.4.0`（破坏性：技能名与标记硬切断）。本 ADR 不执行发布。建议的新技能 tag 是 `skill/<新名>@0.1.0`，由发版时打上；不要移动旧 tag。
- 使用方内容仓里的旧标记与旧技能引用不在本决定的提交里。那些仓要先跑改写脚本，再改调用。
- 已发版 changelog 与已完成计划里出现的旧技能名，保留当时事实。现行说明、技能正文和本 ADR 不再指示调用旧名。
