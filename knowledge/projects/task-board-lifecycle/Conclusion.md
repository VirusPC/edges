# Conclusion：todo→task 的状态机设计结论

> 日期: 2026-09-10
> 专题: task-board-lifecycle
> 依据: 同目录 [任务发布看板状态流转调研](任务发布看板状态流转调研.md)（下称主报告）。本文不是调研，是应用结论——把调研结果套到本仓库「knowledge/todos/ → task」场景后拍板的设计决策。

## 场景设定

- `knowledge/todos/` 是给人自己记和勾的个人清单（README 已明确），即 Kanban 语义的「选项池 / 系统外 backlog」。
- 目标：把 todo **显式转化**成 agent 可执行的任务；执行方是自家 agent（ZCode / Claude Code 等仓库内会话），**指派制，不是抢单**。
- 模板选型：**Multica**（agent 原生、指派制、双层解耦），裁剪其机器调度部分。理由见主报告 1.7 与 TL;DR 第 8 条。

## 设计决策

### 1. 双层状态机：文件是 Issue，Run 是挂上去的执行记录

- 每个 task 文件本身 = Issue，**只有一个状态字段**。
- Run 不是文件，是 1:N 挂在文件上的执行记录（Multica 原话："One issue can span many runs"），每条有自己的状态。
- **task 状态永远不由 run 状态直接推**——两层只通过下面的桥接规则联动。「这件事处于什么阶段」看 Issue 状态，「agent 试了几次、每次结果如何」看 Run 记录。

### 2. Issue 层：7 态松散看板（照抄 Multica 类别）

`backlog / todo / in_progress / in_review / done / blocked / cancelled`

- `todo`：转化落点，已指派或待指派。
- `in_progress`：agent 开始执行。**没有独立 Claimed**——指派制下认领与开工是同一瞬间。
- `in_review`：agent 交付、等人验收（对应 Azure Resolved / MTurk Reviewable）。
- `done`：人工确认或 PR 合并，**唯一正向终态**。
- `blocked` / `cancelled`：一等状态（跟 Multica 走；换来整个「无固定流转、任意可跳」的松散看板，个人系统不用维护 transition 权限）。
- `backlog`：类别定义保留但**基本闲置**——todos 目录已是系统外池子，转化即落 `todo`，不要两层 backlog。

### 3. Run 层：5 态（砍掉 Multica 的 4 个调度态）

`pending / running / completed / failed / cancelled`

- 砍掉 `deferred / queued / dispatched / waiting_local_directory`：那是多台执行机器上常驻 daemon 从队列抢单的调度态，本场景执行方是仓库里的 agent 会话，一个都用不上。
- 每条 Run 落库：`started_at`、`ended_at`、`status`、`error_code`、`attempt`。
- `error_code` 用**稳定枚举分类**（如 `runtime_offline`、`agent_side_err`），不用自由文本。

### 4. 桥接规则（三条，整套设计里最值钱的部分）

1. Run 交付 → **agent 自己把 Issue 写 `in_review`**（run 完成不自动置 done）。
2. 全部 Run 失败且不再重试 → Issue 从 `in_progress` **回滚 `todo`**；瞬态错误内建自动重试（Multica 默认 2 次），agent 侧错误不自动重试、留给人工。
3. `done` = 人工确认或 PR 合并；置 done 时**自动勾掉 `knowledge/todos/` 里的 origin todo**（单一事实源，防止两边状态漂移）。

### 5. 明确不要的（都有出处）

| 砍掉的东西 | 原因 |
|---|---|
| `Draft` 草稿态 | 转化是显式动作，转化那一刻就是 commitment point；todos 目录已是草稿池，不要两层草稿 |
| `Expired` / 认领超时 / 验收超时 | 抢单平台（MTurk、猪八戒）防「挂很久没人接」的机制；指派制没有此问题，Multica 自己也没有。将来真忘记验收，再补 MTurk 式自动通过也不迟 |
| 独立 `Claimed` 态 | 指派制下认领 = 开工，分开只对多人抢单有意义 |
| Issue 层的 `failed` | failed 属于 Run 层；task 不停在 failed 上，重试历史天然保留在 Run 记录里 |

### 6. 文件格式：frontmatter 放标量，正文放流水

分放标准是数据性质：**要被查询/筛选的标量进 frontmatter；追加型时间序列进正文**。

```markdown
---
status: in_progress
origin_todo: knowledge/todos/2026-09-09--memory需要assets资源目录.md
assignee: zcode
created: 2026-09-10
---

【任务】为 .memory 设计 assets 资源目录

【执行记录】
| # | agent | started_at | ended_at | status | error_code |
|---|---|---|---|---|---|
| 1 | zcode | 09-10 14:00 | 09-10 14:12 | failed | agent_side_err |
| 2 | zcode | 09-10 14:20 | — | running | — |
```

Run 不放 frontmatter 的理由：N 条 × 多字段在 YAML 里是嵌套列表，Obsidian 属性面板难读难改；文件头无界膨胀；agent 改 YAML 有整块重排风险，改坏缩进会连累 `status` 解析。正文表格追加一行即完事，diff 干净，读起来就是 changelog。

给 agent 的写入约定（两条，写进 task skill / AGENTS.md 类约定）：

1. 执行记录只在固定段名（【执行记录】）下的表格**末尾追加行**，不改历史行；
2. frontmatter 只改 `status` 的值，**不重排其他键**。

### 7. todo→task 转化语义

- 转化 = 从「可能做」到「承诺做」的边界（commitment point），由人显式触发，不自动批量转。
- 转化动作落库：`origin_todo` 引用 + `converted_at`；终点是 Issue 的 `todo` 态（或带指派直接 `in_progress`）。

## 方案演进记录（为什么是这个形状）

1. 最初草稿：草稿→已发布→进行中→待验收→已完成 + 已取消/退回/挂起（单层）。
2. 主报告第 6 节：验证后扩成通用九态（含 Draft/Expired/Reopened），面向抢单/众包场景。
3. 本结论：落到「指派自家 agent」场景，套用 Multica 双层并裁剪——执行失败从 task 状态挪到 Run 层，砍掉超时与草稿，重试历史天然保留。若未来 task 会由 agent 反复独立执行（每次重试是全新运行、要保留日志），双层优于任何单层方案。

## 与主报告第 6 节的关系

主报告第 6 节是**通用建议**（面向有认领竞争的平台场景）；本文是**本仓库场景的应用结论**。两者不冲突：通用九态里的 `Published/Claimed/Expired` 在指派制下分别弱化为 `todo`、并入 `in_progress`、砍掉；`Failed` 从 Issue 层移到 Run 层。
