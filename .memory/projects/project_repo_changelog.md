---
name: project_repo_changelog
description: "写 Edges 仓库级变更时用根目录 CHANGELOG.md 和 v 标签。Unreleased 的 ### 用功能模块原名（如 Changed、笔记入库与能力面、文档与系统、任务看板与项目、Artifacts 预览），不要改成「模块：摘要」或只留摘要；每条前面写成 `- **小标题：** 正文`，小标题白话摘要，正文不因精简文风大段删实现说明（示例 commit a80d1b0）。用人话写清「现在能做什么」，同一条里立刻给出真实命令名；对照 [1.2.0] 的完整句，不要堆 schema 字段表。枚举写仓库英文原值（优先级是 urgent/high/medium/low/none）。不要摊成扁平长列表，也不要把决策/术语/计划逐条写进去。"
metadata:
  edges-title: 仓库用根 CHANGELOG 和 v 标签发版
  edges-type: project
  edges-origin-session-id: bc-fac597fd-2b64-5779-8f6d-c1d20b4284d2
  edges-agent-client: cursor
  edges-username: Cursor Agent
  edges-email: cursoragent@cursor.com
  edges-updated-at: "2026-09-25T06:22:21+00:00"
---

Edges 仓库自己有一份根目录 `CHANGELOG.md`（Keep a Changelog）和 `vX.Y.Z` tag，版本号以 `package.json` 的 `version` 为准。这和对外技能的独立发版、`shared-extensions/` 的整层发版并行，不是把那些 changelog 抄到根上。根 `[Unreleased]` 只记读者扫「这个系统最近能做什么」时需要看到的仓库级能力，按功能模块分组，用好懂的完整中文来写；能力如果是命令，同一条里必须写出真实命令名。枚举和 flag 取值写仓库里的英文原值，不要改成中文意译。语气对齐 `[1.2.0]`：完整句子，不要把 schema 字段表或 flag 汤堆进一段。

Unreleased 的书写格式（peng cheng 2026-09-25 锁定，用户所述）：小节 `###` 标题用功能模块原名，例如 `Changed`、`笔记入库与能力面`、`文档与系统`、`任务看板与项目`、`Artifacts 预览`，不要改成「模块：摘要」，也不要只留摘要。每一条 `-` bullet 前面加短小标题，写成 `- **小标题：** 正文…`。小标题用白话，能摘要该条；正文保持可读，不要因为「精简文风」大段删改实现说明（细节取舍另议）。已落地示例是 commit `a80d1b0` 的 Unreleased。

**Why:** 仓库是一个发版单元（命令行、MCP、脚本、知识库约定、分发方式），对外技能是另一个，跨机器扩展又是一个。根 changelog 让人能扫系统级变化；把技能明细、领域决策、术语表或实现计划写进来会和各自真源重复。扁平的 Added/Changed/Removed 长列表也会把同一模块拆散，读者扫不到主题。条目如果堆满内部缩写，或者只写「列出、查看」却不写 `list` / `get`，读者既读不懂，也没法去敲命令。优先级若写成「紧急 / 高 / 中 / 低 / 无」，和 `urgent | high | medium | low | none` 对不上，读者会按错值。2026-09-21 用户纠正：为了「一条更密」把 `edges.tasks.grouped/v1` 字段表塞进一段，反而不如 `[1.2.0]` 好读。2026-09-25 peng cheng 再锁定标题形状：当天曾把 Unreleased 的 `###` 改成概括正文（`d6d5623`），随即退回模块原名，并在每条前加小标题（`a80d1b0`）。小节若写成「模块：摘要」或只留摘要，模块名就没了，同一模块不好归并；条目若没有短标题，扫的时候必须读完整段。小标题只负责摘要，不能借精简把正文里的实现说明整段删掉。

**How to apply:** 改基础设施、MCP、目录约定、分发或跨技能的仓库行为时，把**已经落地**的能力写进根 `CHANGELOG.md` 的 `[Unreleased]`。Unreleased 按功能模块分小节（例如：任务看板与项目、项目记忆、评测与观测、笔记入库与能力面、教学站点）。任务看板（CRUD/优先级）和任务项目/审阅/classify 写在同一个模块标题下，例如「任务看板与项目」，不要拆成两组。不要再摊成一条条互不相关的 Added/Changed/Removed 扁平列表；同一模块里的新增、改动、删除可以写在一起，删除用「移除了…」说清即可。每条先用人话说明用途，再立刻给出命令名或技能目录（放进反引号）。例如写任务看板时要出现 `edges tasks list`、`edges tasks get`、`edges tasks create`、`edges tasks update`、`edges tasks status`，优先级写 `--priority`，取值必须是 `urgent` / `high` / `medium` / `low` / `none`（缺省 `none`），排序写 `--sort priority`，项目写 `--project` 与 `edges tasks project list|get|create|update`，审阅页写 `edges tasks project review-page`。其他工具同样写出真实名字，如 `$project-memory-add-type`、`$user-memory-backup`、`$user-memory-restore`、`edges note`。同一能力的几步（列出、部署生成、一次性 nginx）可以拆成几条短句，对照 `[1.2.0]`；不要为了「一条更密」塞 schema 字段表。一条里也不要塞好几件互不相关的模块。做仓库发版时升 `package.json` version、把 Unreleased 挪到 `## [x.y.z] - YYYY-MM-DD`（可保留模块小节）、打 annotated tag `vX.Y.Z`、`git push origin main --follow-tags`。只改某一个对外技能的补丁：走该技能的 changelog 和 `skill/<name>@<version>`，不必升仓库版本，也不要在根 changelog 逐条复述。只改 `shared-extensions/` 里的扩展：走 `shared-extensions/CHANGELOG.md` 和 `shared-extensions@x.y.z`，同样不必升仓库版本。新增或删除技能 / 这个扩展发版单元、改变分发方式或 `extensions/` 与 `shared-extensions/` 的边界，算仓库级，写入根 changelog。查找用 `git show v1.0.0`。

写 Unreleased 时，`###` 用功能模块原名（如 `Changed`、`笔记入库与能力面`、`文档与系统`、`任务看板与项目`、`Artifacts 预览`），不要改成「模块：摘要」或只留摘要。每一条写成 `- **小标题：** 正文…`；小标题白话、能摘要该条。正文保持可读，不因「精简文风」大段删改实现说明，细节取舍另议。照 commit `a80d1b0` 的 Unreleased 写，不要把已有 Unreleased 再整段改成另一种标题风格。`[1.2.0]` 仍是完整句语气的对照，不是小节标题或条目前小标题的模板；已发版段落不必为了这个格式回头改。不要在别的记忆里再写一套标题格式；`feedback_changelog_no_schema_dump` 只管别堆 schema，不管这个形状。

**Avoid:** 不要在根 changelog 逐条登记「新增 `docs/adr/NNNN-….md`」「CONTEXT 增加/收紧某术语」「`docs/superpowers/plans/…` 计划稿」，也不要写「本轮只定文档 / 本计划 PR 不实现」这类过程说明。决策正文在 `docs/adr/`，术语在 `CONTEXT.md`，计划在 `docs/superpowers/plans/`。同一能力的决策修订也不要在根 changelog 复述。不要用电报体、内部暗号或缩写堆砌条目（例如不要写 `Q18=A`、不要把「命令行 + 技能 + MCP」收成口号、不要把决策编号当新闻、不要假设读者知道 `SoT` / `NCC` 这类内部词）。也不要只写「列出、查看、创建、更新」却不写子命令；反过来也不要变回只堆 flags、没有人话的电报体，更不要展开 `{ schema, groups[{id,title…}] }` 这种字段表。不要把仓库里的英文枚举意译成中文档位名（优先级不要写成「紧急 / 高 / 中 / 低 / 无」）。不要把 Unreleased 再摊成没有模块的扁平长列表。不要把 Unreleased 的 `###` 改成「模块：摘要」或只留摘要。不要写没有 `- **小标题：**` 的 Unreleased bullet。不要为了变短而大段删掉正文里的实现说明。
