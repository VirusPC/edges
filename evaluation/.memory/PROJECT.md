# PROJECT — 项目上下文

> 记：进行中的工作、关键时间点，以及无法从代码或 git 历史推导出来的决策及其原因，还有项目内的规范。对不上 `user` / `feedback` / `reference` 时也走这里（兜底）。
> 不记：架构、目录结构、文件路径、调试过程——这些直接读代码更准。
> 怎么写：正文先一句结论，再跟 `**Why:**`（为什么，便于以后判断边界情况）和 `**How to apply:**`（具体怎么做）。相对日期换成绝对日期。
> 本文件只是索引，条目区块由脚本重算，正文写在 `projects/project_<slug>.md` 里。

<!-- project-memory-entries:start -->
- [LoCoMo 冒烟是截断上下文基线，dummy dry-run 无 API](projects/project_locomo_smoke_truncated_baseline.md) — 跑或改 evaluation/cases/locomo-smoke 时：dummy 用 python3 run.py dry-run（不要 key）。真实 run 用 Kimi Code Console 的 KIMI_API_KEY + OPENAI_BASE_URL=https://api.kimi.com/coding/v1，模型 kimi-for-coding；不要用 Moonshot pay-as-you-go api.moonshot.ai。SUT 是上游 locomo 打分；不要接 Project Memory。
<!-- project-memory-entries:end -->
