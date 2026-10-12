# 2026-10-05 周复盘

## 范围

2026-10-05 00:00 至 2026-10-11 24:00（Asia/Shanghai）。看了 `origin/main` 的提交、这周的 PR 与 Actions，以及 `.harness/tasks`；对话层用的是各助手这周对话的提炼。

## 本该怎样

这周事先没有写下显式目标。这是第一份按现行模板写的周复盘，没有上一期「下次做什么」可以验收。

## 实际怎样

上期行动：没有。

`main` 上这周 56 个提交，从 [#161](https://github.com/VirusPC/edges/pull/161) 到 [#218](https://github.com/VirusPC/edges/pull/218)。主干是把递归维护空间落地：[#163](https://github.com/VirusPC/edges/pull/163)、[#165](https://github.com/VirusPC/edges/pull/165)、[#166](https://github.com/VirusPC/edges/pull/166)、[#167](https://github.com/VirusPC/edges/pull/167) 合入后，清单挂到材料 README（[#170](https://github.com/VirusPC/edges/pull/170)），命令名跟目录对齐且不留旧名（[#172](https://github.com/VirusPC/edges/pull/172)），笔记 / 技能 / 项目的读写收进 NodeService（[#187](https://github.com/VirusPC/edges/pull/187)），`edges init` 改成各模块各管各的（[#190](https://github.com/VirusPC/edges/pull/190)）。[#196](https://github.com/VirusPC/edges/pull/196) 准备了 v1.4.0，远端有 tag [`v1.4.0`](https://github.com/VirusPC/edges/releases/tag/v1.4.0)。

部署只走 [Deploy](https://github.com/VirusPC/edges/blob/main/.github/workflows/deploy.yml)。窗口内该工作流 47 次：成功 20、失败 26、取消 1。失败例：[run 37731883857](https://github.com/VirusPC/edges/actions/runs/37731883857)（[#192](https://github.com/VirusPC/edges/pull/192)）。窗口内最后一次是成功的 [#218](https://github.com/VirusPC/edges/actions/runs/38150377429)。[#193](https://github.com/VirusPC/edges/pull/193) 让部署先生成 schema；[#194](https://github.com/VirusPC/edges/pull/194) 把站点迁移收成固定入口。仓库里没有测试或评测工作流。

评测与观测：[#201](https://github.com/VirusPC/edges/pull/201)、[#202](https://github.com/VirusPC/edges/pull/202)、[#205](https://github.com/VirusPC/edges/pull/205)、[#207](https://github.com/VirusPC/edges/pull/207)。代码审查：[#200](https://github.com/VirusPC/edges/pull/200) 打开 CLI 的 Bugbot；自动点名的 [#209](https://github.com/VirusPC/edges/pull/209)、[#212](https://github.com/VirusPC/edges/pull/212) 关闭未合并，结论在 [#213](https://github.com/VirusPC/edges/pull/213)。[#208](https://github.com/VirusPC/edges/pull/208)、[#211](https://github.com/VirusPC/edges/pull/211) 随 [#204](https://github.com/VirusPC/edges/pull/204) 合入。中文任务名的命令行为在 [#210](https://github.com/VirusPC/edges/pull/210)、[#214](https://github.com/VirusPC/edges/pull/214)。

[#216](https://github.com/VirusPC/edges/pull/216)、[#219](https://github.com/VirusPC/edges/pull/219)、[#220](https://github.com/VirusPC/edges/pull/220) 已经合并，时间是周一凌晨 00:28、00:37、00:51（北京时间）。[#217](https://github.com/VirusPC/edges/pull/217) 把 Harness 流转卡放进 backlog。[#174](https://github.com/VirusPC/edges/pull/174) 的补齐卡仍在 backlog。[#187](https://github.com/VirusPC/edges/pull/187) 已合并，对应任务卡仍在 `in_progress`。

2026-10-12 重跑 `pnpm --filter edges-cli test`：1015 通过，0 失败。

## 为什么

可能因为这周没有事先写周目标，PR 按对话收尾，所以三份教学内容的 PR 跨过周日 24:00 才合并，周内看起来还敞着。可能因为「不许绕过 NodeService」写在任务卡里、没有收成一处硬约束，实现合并之后卡还停在 `in_progress`。

该保持的：令牌不进仓库。自动点名走不通就关掉方案、把结论写成任务卡（[#213](https://github.com/VirusPC/edges/pull/213)），而不是把凭据放进 Actions。

## 下次做什么

1. 把 NodeService 硬约束写进 `AGENTS.md`，并把 [#187](https://github.com/VirusPC/edges/pull/187) 对应的任务卡状态改对。完成标准：硬约束正文写明写盘走 NodeService；[这张卡](../../../.harness/tasks/edges-extensions/in_progress/2026-10-07--notesskills-的-creategetupdatedelete-收口到-NodeService/INDEX.md) 不再停在 `in_progress`。
2. 给 doctor 报不出断掉的软链接开一张任务卡。完成标准：`.harness/tasks` 里有这张卡。
3. 补齐 [#174](https://github.com/VirusPC/edges/pull/174)。完成标准：`notes`、`edges`、`projects`、`archive` 在 CLI 与根 `.harness` 材料登记上可发现、可操作，命名跟文件夹一致；[这张卡](../../../.harness/tasks/edges-extensions/backlog/2026-10-07--CLI-与根-harness-补齐-notes-edges-projects-archive/INDEX.md) 离开 backlog。

## 建议补充内容清单

- 硬规则没有集中到一处。建议去处：`AGENTS.md` 硬约束。处理结果：已列入下次做什么。
- doctor 报不出断掉的软链接，没有卡。建议去处：`.harness/tasks`。处理结果：已列入下次做什么。
- [#174](https://github.com/VirusPC/edges/pull/174) 只落了卡，补齐还没做。建议去处：[backlog 卡](../../../.harness/tasks/edges-extensions/backlog/2026-10-07--CLI-与根-harness-补齐-notes-edges-projects-archive/INDEX.md)。处理结果：已列入下次做什么。
- 按目录管可写记忆的调研没有 `report.md`。建议去处：`projects/`。处理结果：待用户确认。
- 任务名要保留中文，这条规则没写进硬约束。建议去处：根 `AGENTS.md` 或 `.harness/memory`。处理结果：待用户确认。
- 「森林在 traverse 之外」要另开一小份 PR。建议去处：`CONTEXT.md`。处理结果：已完成。这句话已在 [`CONTEXT.md`](../../../CONTEXT.md)（[#167](https://github.com/VirusPC/edges/pull/167)）。
- Harness 在知识流转里的位置。建议去处：任务看板。处理结果：已完成。卡在 backlog：[这张卡](../../../.harness/tasks/edges-extensions/backlog/2026-10-11--厘清-Harness-模块在知识流转中的位置/INDEX.md)（[#217](https://github.com/VirusPC/edges/pull/217)）。
- 自动点名 Bugbot 与不用个人访问令牌的理由。建议去处：任务卡。处理结果：已完成。理由在 [搁置卡](../../../.harness/tasks/edges-extensions/todo/2026-10-11--搁置只让-CLI-的-PR-自动触发-Bugbot/INDEX.md)（[#213](https://github.com/VirusPC/edges/pull/213)）。
