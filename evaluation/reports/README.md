# reports/

某次评测运行的报告。有真实结果再往这里写；不要预埋假分数。

LoCoMo 报告都是 Evaluation Smoke，不是 Benchmark Proof，也不是 Project Memory proof。

- **Preferred official path** (`evaluation/run_locomo_official.py`): `{date}-locomo-official-smoke-{model}.md` / `.json`。F1 来自 submodule 的 `task_eval/evaluation.py`。
- **Legacy hand-port** (`evaluation/cases/locomo-smoke/`): `{date}-locomo-smoke-{model}.md` / `.json`。PR #70 历史报告保留，不要无故删除。
- Dummy dry-run（占位答案）用日期后缀 `-dry-run`，例如 `2026-09-16-locomo-smoke-dry-run.md`。

约定见上一级 [README](../README.md)。
