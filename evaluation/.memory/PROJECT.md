# PROJECT — 项目上下文

> 记：进行中的工作、关键时间点，以及无法从代码或 git 历史推导出来的决策及其原因，还有项目内的规范。对不上 `user` / `feedback` / `reference` 时也走这里（兜底）。
> 不记：架构、目录结构、文件路径、调试过程——这些直接读代码更准。
> 怎么写：正文先一句结论，再跟 `**Why:**`（为什么，便于以后判断边界情况）和 `**How to apply:**`（具体怎么做）。相对日期换成绝对日期。
> 本文件只是索引，条目区块由脚本重算，正文写在 `projects/project_<slug>.md` 里。

<!-- project-memory-entries:start -->
- [LoCoMo 官方冒烟走 VirusPC/locomo submodule](projects/project_locomo_official_submodule_path.md) — 跑或改 LoCoMo Evaluation Smoke 时：首选 evaluation/run_locomo_official.py（submodule 官方 evaluate_qa.py / evaluation.py F1）。print-command 无 key；真实 smoke 用 KIMI_API_KEY + kimi-for-coding。evaluation/cases/locomo-smoke 是 legacy hand-port。不是 Benchmark Proof / Project Memory proof。
- [LoCoMo 官方 QA 是事后静态库，不等于 PM-online](projects/project_locomo_online_produce_consume_vs_posthoc_qa.md) — 评 Project Memory / PM-online 或对照官方 RAG/截断基线时：官方 QA 是事后静态库，不等于对话中 write→use。全文见 knowledge/projects/memory/2026-09-16-LoCoMo-paper-10-questions.md「补充：过程中产生/消费 vs 事后静态库」。四臂仍 paused；分数按 ADR 0008 不是 PM proof。
- [LoCoMo 冒烟是截断上下文基线，dummy dry-run 无 API](projects/project_locomo_smoke_truncated_baseline.md) — 改 evaluation/cases/locomo-smoke 时：这是 legacy hand-port。新跑用 evaluation/run_locomo_official.py。dummy 仍可用 python3 run.py dry-run（不要 key）。真实 run 若走旧入口：KIMI_API_KEY + OPENAI_BASE_URL=https://api.kimi.com/coding/v1，模型 kimi-for-coding。SUT 是上游 locomo 打分；不要接 Project Memory。
<!-- project-memory-entries:end -->
