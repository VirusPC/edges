# reports/

某次评测运行的报告。有真实结果再往这里写；不要预埋假分数。

- [2026-11-09 Harbor 自然合成补充 v2 冻结测试评估](../experiments/harness_memory_ablation/harbor/synthetic/v2/TEST_RESULTS.md)：在已知开发局限后保持输入不变，完成 36 test × 3 条件 × 3 次，共 324 次、零失败；必要证据召回、资源与固定 gold 集合诊断分别解释。
- [2026-11-09 Harbor 自然合成补充 v2 开发诊断](../experiments/harness_memory_ablation/harbor/synthetic/v2/RESULTS.md)：48 题、336 条记忆中的 12 dev × 3 条件，共 36 次；确认 1 个漏检场景，未达预声明的两场景门槛，并发现最小必要 gold 与相关背景选择的契约边界。保留当时记录，后续 test 单独报告。

- [2026-11-09 Harbor 合成场景消融 / gpt-6.1-sol](../experiments/harness_memory_ablation/harbor/synthetic/RESULTS.md)：32 题、288 次运行；scoped/root recall 均 100%，scoped 总 token 少 35.75%、Agent 时延短 15.87%。区分的是受控合成场景的资源开销，不能替代真实数据结论；生成器、完整题集与协议同目录保留。

- [2026-11-09 Harbor 真实记忆消融 / gpt-6.1-sol](2026-11-09-harbor-memory-ablation.md)：31 题、279 次运行的三条件公开聚合结果；整体 recall、token、时延均未证明分层优于平铺，6 题非根作用域子集仅为探索性信号。
- [2026-10-11 MemoryBench NFCats / MiniMax-M2.5](2026-10-11-memorybench-nfcats-smoke-minimax-m2.5.md)：无记忆与 BM25-M 各 10 题，两组均为 4.5/5；链路冒烟，未接入 Edges Project Memory。

LoCoMo 报告都是 Evaluation Smoke，不是 Benchmark Proof，也不是 Project Memory proof。

检索评测报告由 `experiments/retrieval_eval/run.py run` 写出，文件名带时间戳和 cell id，标题标明 Evaluation Smoke。没有真实运行就不要在这里放分数。

- **Preferred official path** (`experiments/locomo/run_locomo_official.py`): `{date}-locomo-official-smoke-{model}.md` / `.json`。F1 来自 submodule 的 `task_eval/evaluation.py`。
- **Legacy hand-port** (`experiments/locomo/cases/locomo-smoke/`): `{date}-locomo-smoke-{model}.md` / `.json`。PR #70 历史报告保留，不要无故删除。报告正文里的旧命令路径是当时的运行记录。
- Dummy dry-run（占位答案）用日期后缀 `-dry-run`，例如 `2026-09-16-locomo-smoke-dry-run.md`。

约定见上一级 [README](../README.md)。
