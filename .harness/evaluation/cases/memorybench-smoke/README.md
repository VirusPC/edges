# MemoryBench NFCats 小规模试跑

用官方 THUIR/MemoryBench 的 NFCats 数据、无记忆与 BM25-M 实现及原生裁判，检查下载、记忆写入、检索、作答、评分和运行记录链路。默认选官方 train/test 各自前 10 条；单线程，最多 40 次模型请求。不是完整 benchmark 成绩，也未接入 Edges Project Memory。

- 上游代码：<https://github.com/THUIR/MemoryBench>，固定 `247ba8c1e327fa297c0d57aaad0e3cbd66bac656`。
- 数据：<https://huggingface.co/datasets/THUIR/MemoryBench>，固定 `3acd60a4bd35b43b408f0e6db4c5f1e88df5e96d`。
- NFCats 原始划分为 200 条 train、50 条 test。只下载 NFCats 的 Arrow 文件；使用官方转换函数、提示词、BM25 实现和评分方法，不改上游源码。
- 与官方 off-policy 默认一致，读取 `dialog` 字段。当前前 10 条都是一问一答，共两条消息，没有后续用户纠正；它们只验证历史问答复用。包含后续反馈的 `dialog_mistral` 字段需要另立实验，不能用本次结果声称反馈学习有效。
- BM25-M 按单条消息建索引，取 top-1，实际为上游 Whoosh 默认 BM25F。原生 NFCats 分数为 1–5，不做跨数据集归一化。
- 保留上游两臂的提示词：BM25 会额外套入 `Context` 和根据上下文回答的指令，即使没有检索结果也如此。因此两臂还存在提示词差异，不能把单次分差全部归因于记忆内容。

## 准备

在独立 worktree 的仓库根执行。已存在的 checkout 和虚拟环境可复用；上游 commit 不符或有改动时脚本会拒绝运行。

```bash
mkdir -p .harness/evaluation/.cache/memorybench
git clone https://github.com/THUIR/MemoryBench.git .harness/evaluation/.cache/memorybench/upstream
git -C .harness/evaluation/.cache/memorybench/upstream checkout 247ba8c1e327fa297c0d57aaad0e3cbd66bac656
uv venv --python 3.11 .harness/evaluation/.cache/memorybench/venv
uv pip install --python .harness/evaluation/.cache/memorybench/venv/bin/python -r .harness/evaluation/cases/memorybench-smoke/requirements-lock.txt
.harness/evaluation/.cache/memorybench/venv/bin/python .harness/evaluation/cases/memorybench-smoke/run.py --prepare-only
```

`--prepare-only` 下载固定数据并记录选题 ID，不调用模型。准备记录在 `.cache/memorybench/preparation.json`。

## 真实运行

在这次独立 worktree 根目录的 `.env` 中配置：

```dotenv
# 填入 MiniMax 中国区的 API key；变量名沿用 OpenAI 兼容客户端约定。
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.minimax.cn/v1
MEMORYBENCH_MODEL=MiniMax-M2.5
```

`.env` 已被 Git 忽略，不提交密钥。脚本只读取自身 worktree 根目录的 `.env`，仅加载模型及裁判配置；进程环境中的同名变量优先。不执行 shell 语句或变量展开。模型须使用该 key 实际支持的名称；以上配置已用于 [2026-10-11 的真实试跑](../../reports/2026-10-11-memorybench-nfcats-smoke-minimax-m2.5.md)。MiniMax 请求使用 `reasoning_split=true`，避免把思考内容送入回答评分。不要将密钥写进本目录、命令参数或报告。

```bash
.harness/evaluation/.cache/memorybench/venv/bin/python .harness/evaluation/cases/memorybench-smoke/run.py \
  --output .harness/evaluation/.cache/memorybench/run-001
```

默认同一模型作答和裁判；可用 `--judge-model` 指定另一模型，或用 `EVALUATE_BASE_URL` / `EVALUATE_API_KEY` 配置另一裁判服务。输出目录必须不存在，防止覆盖记录或意外重复计费。`--max-output-tokens` 默认 4096，包含推理模型所需的生成预算。

结果保留 manifest、逐题回答、真实检索文本、原生评分、裁判原文、token 用量和耗时。API 失败、空回答、截断回答、评分越界均终止；不把上游错误回退值当作真实低分。费用需按实际服务计费口径另算。

读取 `results.json` 的 `status`：只有 `completed` 才是完成的试跑。小样本、同模型裁判、单次采样与有限历史均限制结论；平均分差不能单独证明记忆增益。
