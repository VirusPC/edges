# shared/

实验之间可以复用的导入面。Agent client 的实现仍在 [`../experiments/retrieval_eval/client.py`](../experiments/retrieval_eval/client.py) 和 [`config.py`](../experiments/retrieval_eval/config.py)。这里只再导出，不复制命令、沙箱或打分逻辑。

`import shared` 会把 `experiments/` 放进 `sys.path`，并导入 `retrieval_eval`，从而把 `packages/observation` 放进 `sys.path`。`langfuse_sink` 保持原样，不在这里改。

新实验从 `shared.agent_client` 取 `run_client`、`codex_command`、`pi_command` 和 client 注册表。路径检索实验自己的入口仍直接使用 `retrieval_eval`。
