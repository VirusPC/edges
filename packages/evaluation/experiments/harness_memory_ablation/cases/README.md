# harness-memory-ablation

自由问答用例，不是路径检索样本。每条是 Dataset 形状：`input.question`、`expectedOutput.criteria`、`expectedOutput.violations`、`metadata.category`（`memory-dependent` / `memory-irrelevant` / `conflict-stale`）。

- [`smoke.json`](smoke.json)：2 题，给 `print-command --samples 1` 和离线测试。不代替 30 题。
- Dataset `harness-memory-ablation/v1` 的 30 题在个人主干仓 `evaluations/harness-memory-ablation`。本仓不登记该仓名，也不把那份题库提交进来。本地导出后用 `--cases` 指向它。

跑法见 [`../README.md`](../README.md)。
