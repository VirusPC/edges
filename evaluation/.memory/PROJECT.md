# PROJECT — 项目上下文

> 记：进行中的工作、关键时间点，以及无法从代码或 git 历史推导出来的决策及其原因，还有项目内的规范。对不上 `user` / `feedback` / `reference` 时也走这里（兜底）。
> 不记：架构、目录结构、文件路径、调试过程——这些直接读代码更准。
> 怎么写：正文先一句结论，再跟 `**Why:**`（为什么，便于以后判断边界情况）和 `**How to apply:**`（具体怎么做）。相对日期换成绝对日期。
> 本文件只是索引，条目区块由脚本重算，正文写在 `projects/project_<slug>.md` 里。

<!-- project-memory-entries:start -->
- [本轮 LoCoMo 只做评测冒烟](projects/project_locomo_smoke_not_project_memory_proof.md) — 做 LoCoMo 或改 evaluation/ 冒烟用例时：SUT 是上游 LoCoMo harness，产物是评测报告；不要把分数当项目记忆证明，也不要把项目记忆接到 LoCoMo 当后端。决策见 docs/adr/0008-evaluation-smoke-is-not-benchmark-proof.md。
<!-- project-memory-entries:end -->
