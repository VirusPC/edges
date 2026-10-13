---
name: daily-conversation-deposit
description: 每日沉淀扫描（日复盘）。回顾过去 24 小时各 Grok Bot 助手的对话，只出沉淀候选，并把当日复盘经 PR 写入 retrospectives/daily。
---

# 每日沉淀扫描（日复盘）

回顾 peng cheng 过去 24 小时（Asia/Shanghai）在所有 Grok Bot 助手里的对话，按 VirusPC/edges 根 AGENTS.md 判断哪些该沉淀（笔记、任务、记忆/feedback 等它定义的类型；个人内容去 edges-private）。

何时跑见同目录 [schedule.md](schedule.md)。本文件不写日程。

## 步骤

### 1. 先抓取落盘

用 ReadTranscript，逐个传 agent_id 读每个助手（含自己），从最新往前翻页（before），翻到超出 24 小时窗口为止（记录无显式时间时，结合消息里的日期、PR 时间、记忆日期判断）。把每个助手窗口内的原始记录写到 `/workspace/daily-scan/YYYY-MM-DD/<助手名>.jsonl`，并按时间正序排好。这些落盘文件永久保留：不删除、不覆盖、不清理往期目录（同一天重跑时另存为带序号的新文件）。

### 2. 再离线分析

只基于落盘文件，按时间从前往后读，判断沉淀候选。共享记忆和 GitHub 合入记录只用来交叉核对、去重（已合入的跳过）。

只出候选，不直接写其它沉淀内容、不改记忆：每条写来源助手、内容、依据 AGENTS.md 的理由、建议落点和下一步。有候选则转给用户确认；没有新候选则不要向用户索要沉淀确认（日复盘仍按步骤 3 入库）。报告里注明落盘目录、读到了哪些助手、哪些读不到。

### 3. 写入当日复盘

每天把当日复盘结果（候选清单 + 扫描局限）写成一份 Markdown，经 PR 入库：

`retrospectives/daily/YYYY-MM-DD--日复盘/INDEX.md`

日期取回看结束时刻所在的日历日（Asia/Shanghai）。同一日只保留一篇，补记改原来的 `INDEX.md`。章节按 [日复盘 README](../../../retrospectives/daily/README.md)：一级标题 `# <YYYY-MM-DD> 日复盘`，必写二级标题「范围」和「建议补充内容清单」。候选写进清单，扫描局限和读到的助手写进「范围」。

这一步只写这份日复盘。笔记、任务、记忆和其它沉淀仍只出候选，等用户确认后再写。没有新候选时不向用户索要确认；日复盘仍要入库，清单里写明没有。

开 PR：用 Cursor 云端 Agent 开到 main 的 PR；**不要自动合并**，留给人审。Commit 带一行 `Co-authored-by: 日复盘 <grok-bot@users.noreply.github.com>`。

公开仓脱敏后再写：不写个人身份细节、未公开 IP、鉴权链接、凭据、私人生活细节。私人条目只概括成「有 N 条私人内容建议进 edges-private」。原始 transcript 不进 edges，只留在 `/workspace/daily-scan/`。

## 成功标准

- 窗口内每个读到的助手都有一份按时间正序的 jsonl，落在 `/workspace/daily-scan/YYYY-MM-DD/`。往期目录仍在。同一天重跑没有覆盖已有文件。
- 候选只来自这些落盘文件。共享记忆和已合入记录只用于核对和去重。
- 除当日日复盘这篇以外，没有改记忆，也没有把笔记、任务或其它沉淀写进仓库。有候选则转给用户确认；没有新候选则不要向用户索要沉淀确认（日复盘仍按步骤 3 入库）。
- 报告写明落盘目录、读到的助手、读不到的助手。
- 当日结果已按上面的路径经 PR 入库：用 Cursor 云端 Agent 开到 main，不自动合并，留给人审；commit 带 `Co-authored-by: 日复盘 <grok-bot@users.noreply.github.com>`。不含原始对话和需要脱敏的内容。
