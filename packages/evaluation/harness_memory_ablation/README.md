# Harness memory 消融 runner

比较同一 Agent、同一题面下，工作目录里有没有 harness memory，对回答、输入 token 和端到端耗时的差别。

回答由 Agent client 在你给的本地目录里自己读文件。默认 `codex exec`。`--client pi` 走已接好的 pi client。提示词只有题目。不会把记忆正文拼进 chat.completions。判分如果打开，才是另一次 chat completion。

这是评测冒烟，不是公开基准证明。方法、门槛和 30 题的真源在个人主干仓 `evaluations/harness-memory-ablation`（Dataset `harness-memory-ablation/v1`）。本仓不登记该仓名。

## 条件

| 条件 | 参数 | 含义 |
| --- | --- | --- |
| A | `--memory-off PATH` | 无 memory 的本地 worktree。cwd 就是这个目录 |
| B | `--memory-on PATH` | 完整 memory 的本地 worktree |

两个目录都在命令外准备好。runner 不 `git clone`、不 checkout、不 reset，因此不会清掉 memory-off 上未提交的实验改动。不要调用 `packages/evaluation/retrieval_eval/run.py`：那条链路会 `sync_clone`，而且指标是路径检索。

Codex 仍用 `clients.json` 里的 read-only sandbox，避免答题时改到 A/B 目录。

## 冒烟

只打印第一条题的命令，不跑模型，也不需要 Langfuse：

```bash
python3 packages/evaluation/harness_memory_ablation/run.py print-command \
  --memory-off /path/to/worktree-A \
  --memory-on /path/to/worktree-B \
  --samples 1
```

`--samples 1` 只留 1 题。`--case S01 --case S02` 按 id 选题，可再被 `--samples` 截断。默认题库是 [`../cases/harness-memory-ablation/smoke.json`](../cases/harness-memory-ablation/smoke.json)（2 题）。

真跑 1 到 2 题（要本机 Agent 凭据；默认 `--judge skip`，没有 Langfuse 密钥就不上报）：

```bash
python3 packages/evaluation/harness_memory_ablation/run.py run \
  --memory-off /path/to/worktree-A \
  --memory-on /path/to/worktree-B \
  --case S01 --case S02
```

## 完整 30 题

30 题不在本仓。从个人主干仓 `evaluations/harness-memory-ablation` 做成 Dataset `harness-memory-ablation/v1` 的 JSON（`items[].input.question`、`expectedOutput.criteria`、`expectedOutput.violations`、`metadata.category`），再：

```bash
python3 packages/evaluation/harness_memory_ablation/run.py run \
  --memory-off /path/to/worktree-A \
  --memory-on /path/to/worktree-B \
  --cases /path/to/harness-memory-ablation-v1.json \
  --repeats 3 \
  --judge llm
```

完整 30 题需要在本 PR 之外准备 Agent 凭据和 A/B worktree。设计上的重复次数是每题每组 3 次；这里的默认 `--repeats` 是 1，方便冒烟。

## 离线

不上报：不设 `LANGFUSE_HOST`（或 `LANGFUSE_BASE_URL`）、`LANGFUSE_PUBLIC_KEY`、`LANGFUSE_SECRET_KEY`。缺任何一个就跳过导出，分数仍写本地报告。

不判质量：默认 `--judge skip`。token 和耗时仍会汇总，正确率门槛记为 unscored，`worth_default_on` 为 false。

要判质量才设 `JUDGE_BASE_URL`、`JUDGE_API_KEY`、`JUDGE_MODEL`，并加 `--judge llm`。这一路才调用 chat completions，而且只发送题目、回答、判对要点和违反项。

## 门槛与上报

同时满足才记 `worth_default_on`：

1. memory-dependent：B 相对 A 的正确率至少 +10 个百分点（只把 `correct` 当对，`partial` 不算）
2. 输入 token：按题中位数再取中位数，B 相对 A ≤15%
3. 端到端耗时：同样口径 ≤10%
4. memory-irrelevant：B 的正确率不低于 A，违反次数不上升

conflict-stale 只报告 B 更差的题，不挡住上面四条。

可选导出的 `service.name` 是 `edges-harness-memory-ablation`，不是 `edges-retrieval-eval`。tags 含 `eval:harness-memory-ablation`、`memory:on` 或 `memory:off`，以及 `run:YYYY-MM-DD`。

事件流在 `packages/evaluation/.cache/harness-memory-ablation/sessions/`（gitignore）。报告在 [`../reports/`](../reports/README.md)，标题写明评测冒烟。报告里会有本地 cwd，提交前自行看一遍。

```bash
python3 -m unittest discover -s packages/evaluation/tests -p test_harness_memory_ablation.py -v
```
