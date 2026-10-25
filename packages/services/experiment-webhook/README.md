# edges-experiment-webhook

Langfuse Custom Experiment 打到这个 HTTP 进程。进程立刻回 **202**，再在本进程里按 Dataset 名字调用登记过的 runner。没有任务队列。

第一条 runner 是 harness memory 消融：`registry.json` 把 `harness-memory-ablation/v1` 指到 `experiment_webhook.runners.harness_memory_ablation`。适配层把 Langfuse Dataset item 收成 `run_experiment` 已经接受的题，不改 runner 本身。本地 case 文件和 Dataset item 不是同一种形状。

取舍记在 [DECISIONS.md](DECISIONS.md)。真从 Langfuse UI 点 Run 的步骤在 [scripts/REAL-CUSTOM-EXPERIMENT.md](scripts/REAL-CUSTOM-EXPERIMENT.md)。

## HTTP

| 方法 | 路径 | 结果 |
| --- | --- | --- |
| GET | `/health` | `200 {"ok": true}` |
| POST | `/langfuse/experiment` | 签名通过且 JSON 合法则 `202 {"accepted": true, "runId"}` |

Body 是 Langfuse Custom Experiment 的官方形状：`projectId`、`datasetId`、`datasetName`、`payload`。路由键是 `datasetName`，对上 `registry.json` 的键。

签名头是 `x-langfuse-signature: t=<unix>,v1=<hex>`，HMAC-SHA256 盖的是原始 body，不是重新序列化的 JSON。密钥用 `LANGFUSE_WEBHOOK_SECRET`。要在开发环境关掉校验：`EXPERIMENT_WEBHOOK_SIGNATURE=off`。校验开着但没设密钥时返回 401，不会当未签名请求收下。

超时默认 600 秒（`EXPERIMENT_RUN_TIMEOUT_SECONDS`）。超时、未知 Dataset 名字、runner 抛错，都已经回过 202，然后写本地报告，并在配了 Langfuse 密钥时写一条失败的 experiment trace 和 `run_ok=0`。成功时 trace 带 `langfuse.experiment.*`，分数里有 `worth_default_on` 和 `run_ok=1`。这个自建实例的 `POST /api/public/scores` 一次收一个对象，不收数组。

超时落在取 Dataset 之前时，不会再启动 runner。超时落在 runner 已经开始之后时，失败记录先写上；Python 线程停不掉，那次调用可能还会跑完。

## 消融 payload

`payload` 是对象，也可以是 JSON 字符串。两个工作目录都要事先准备好。runner 不 clone、不 reset。

```json
{
  "memoryOff": "/absolute/path/worktree-off",
  "memoryOn": "/absolute/path/worktree-on",
  "samples": 1,
  "repeats": 1,
  "judge": "skip",
  "client": "codex",
  "runName": "optional-experiment-name"
}
```

`samples` 和 `caseIds` 传给现有的选题函数。不传就跑 Dataset 里的全部 ACTIVE 题。完整 30 题要 Agent 凭据和两份 worktree，默认 10 分钟不一定够。

## 本地

```bash
cd packages/services/experiment-webhook
PYTHONPATH=. python3 -m unittest discover -s test -p 'test_*.py' -v
LANGFUSE_WEBHOOK_SECRET=… \
LANGFUSE_HOST=… \
LANGFUSE_PUBLIC_KEY=… \
LANGFUSE_SECRET_KEY=… \
PYTHONPATH=. python3 -m experiment_webhook
```

默认 `127.0.0.1:8791`。报告目录默认是仓库里的 `packages/evaluation/reports/`。密钥只放环境变量，不进仓库，也不要把实例域名写进仓库。

登记表是本目录的 `registry.json`：Dataset 名字 → Python 模块。模块提供 `run(context)`。换一个实验就加一行，不必改 HTTP 入口。
